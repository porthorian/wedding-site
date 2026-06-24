export type RsvpLookupInput = {
  fullName: string
  zipCode?: string
}

export type RsvpMatchableRow<T> = {
  value: T
  firstName: string
  lastName: string
  zipCode: string
}

export type RsvpLookupResolution<T> =
  | {
      status: 'matched'
      matches: T[]
      requiresConfirmation: boolean
      hasZipCode: boolean
      strategy: 'exact' | 'fuzzy'
    }
  | {
      status: 'not-found'
      hasZipCode: boolean
    }
  | {
      status: 'duplicate'
      hasZipCode: boolean
    }

type ScoredMatch<T> = {
  value: T
  score: number
  rowIndex: number
}

type RankedTokenMatch<T> = ScoredMatch<T> & {
  matchedTokens: number
}

type FuzzyMatchResult<T> = {
  matches: T[]
  overLimit: boolean
}

const FUZZY_MATCH_LIMIT = 5
const MIN_FUZZY_LAST_NAME_LENGTH = 4
const MIN_FUZZY_FULL_NAME_LENGTH = 5
const MIN_FUZZY_TOKEN_LENGTH = 4
const COURTESY_TITLE_TOKENS = new Set(['mr', 'mrs', 'ms', 'miss', 'mx', 'dr'])
const TITLE_CONNECTOR_TOKENS = new Set(['and'])

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function normalizeInvitationName(value: string): string {
  return normalizeName(value).replace(/&/g, ' and ').replace(/\s+/g, ' ')
}

export function normalizeZipCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

function normalizeSearchName(value: string): string {
  const normalized = normalizeInvitationName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

  return stripLeadingCourtesyTitles(normalized)
}

function stripLeadingCourtesyTitles(value: string): string {
  const tokens = value.split(' ').filter(Boolean)
  if (!tokens.length || !COURTESY_TITLE_TOKENS.has(tokens[0])) return value

  let index = 0

  while (index < tokens.length && COURTESY_TITLE_TOKENS.has(tokens[index])) {
    index += 1

    if (
      index + 1 < tokens.length &&
      TITLE_CONNECTOR_TOKENS.has(tokens[index]) &&
      COURTESY_TITLE_TOKENS.has(tokens[index + 1])
    ) {
      index += 1
    }
  }

  return tokens.slice(index).join(' ')
}

function compactSearchName(value: string): string {
  return value.replace(/\s+/g, '')
}

function splitInvitationNameGroup(value: string): string[] {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s*(?:&|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

function addUnique(values: Set<string>, value: string) {
  if (value) values.add(value)
}

function buildInvitationNameCandidates(firstName: string, lastName: string): Set<string> {
  const candidates = new Set<string>()
  const addCandidate = (value: string) => {
    const normalized = normalizeInvitationName(value)
    addUnique(candidates, normalized)
  }

  addCandidate([firstName, lastName].filter(Boolean).join(' '))

  const firstNames = splitInvitationNameGroup(firstName)
  const lastNames = splitInvitationNameGroup(lastName)

  if (firstNames.length <= 1) return candidates

  if (lastNames.length === firstNames.length) {
    firstNames.forEach((first, index) => addCandidate([first, lastNames[index]].filter(Boolean).join(' ')))
  } else if (lastNames.length === 1) {
    firstNames.forEach((first) => addCandidate([first, lastNames[0]].filter(Boolean).join(' ')))
  }

  return candidates
}

function buildFullNameSearchCandidates(firstName: string, lastName: string): string[] {
  const candidates = new Set<string>()
  for (const candidate of buildInvitationNameCandidates(firstName, lastName)) {
    addUnique(candidates, normalizeSearchName(candidate))
  }
  return Array.from(candidates)
}

function buildLastNameSearchCandidates(lastName: string): string[] {
  const candidates = new Set<string>()
  addUnique(candidates, normalizeSearchName(lastName))
  splitInvitationNameGroup(lastName).forEach((part) => addUnique(candidates, normalizeSearchName(part)))
  return Array.from(candidates)
}

function buildSearchTokens(value: string): string[] {
  return normalizeSearchName(value).split(' ').filter(Boolean)
}

function buildNamePartSearchTokens(value: string): string[] {
  const tokens = new Set<string>()

  for (const part of splitInvitationNameGroup(value)) {
    buildSearchTokens(part).forEach((token) => addUnique(tokens, token))
  }

  return Array.from(tokens)
}

function buildRowSearchTokens(firstName: string, lastName: string): string[] {
  const tokens = new Set<string>()

  buildNamePartSearchTokens(firstName).forEach((token) => addUnique(tokens, token))
  buildNamePartSearchTokens(lastName).forEach((token) => addUnique(tokens, token))

  return Array.from(tokens)
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length

  let twoRowsBack: number[] | null = null
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      let best = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      )

      if (
        twoRowsBack &&
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        best = Math.min(best, twoRowsBack[j - 2] + 1)
      }

      current[j] = best
    }

    twoRowsBack = previous
    previous = current
  }

  return previous[b.length]
}

function maxAllowedDistance(length: number, lastNameOnly: boolean): number {
  if (lastNameOnly) return length <= 5 ? 1 : 2
  if (length <= 8) return 1
  if (length <= 14) return 2
  return 3
}

function maxAllowedTokenDistance(length: number): number {
  return length <= 5 ? 1 : 2
}

function scoreNameCandidate(query: string, candidate: string, lastNameOnly: boolean): number | null {
  if (!query || !candidate) return null
  if (query === candidate) return 0

  const normalizedQuery = lastNameOnly ? query : compactSearchName(query)
  const normalizedCandidate = lastNameOnly ? candidate : compactSearchName(candidate)
  const minLength = lastNameOnly ? MIN_FUZZY_LAST_NAME_LENGTH : MIN_FUZZY_FULL_NAME_LENGTH

  if (normalizedQuery.length < minLength) return null

  const maxLength = Math.max(normalizedQuery.length, normalizedCandidate.length)
  const distance = editDistance(normalizedQuery, normalizedCandidate)
  const similarity = 1 - distance / maxLength
  const minSimilarity = lastNameOnly ? 0.72 : 0.78

  if (distance > maxAllowedDistance(maxLength, lastNameOnly)) return null
  if (similarity < minSimilarity) return null
  if (lastNameOnly && Math.abs(normalizedQuery.length - normalizedCandidate.length) > distance) return null

  return distance / maxLength
}

function scoreTokenCandidate(query: string, candidate: string): number | null {
  if (query.length < MIN_FUZZY_TOKEN_LENGTH || candidate.length < MIN_FUZZY_TOKEN_LENGTH) return null

  const maxLength = Math.max(query.length, candidate.length)
  const distance = editDistance(query, candidate)

  if (distance > maxAllowedTokenDistance(maxLength)) return null

  return distance / maxLength
}

function selectCloseMatches<T>(scoredMatches: ScoredMatch<T>[]): FuzzyMatchResult<T> {
  const bestByValue = new Map<T, ScoredMatch<T>>()

  for (const match of scoredMatches) {
    const previous = bestByValue.get(match.value)
    if (!previous || match.score < previous.score) {
      bestByValue.set(match.value, match)
    }
  }

  const sorted = Array.from(bestByValue.values()).sort((a, b) => a.score - b.score || a.rowIndex - b.rowIndex)
  if (!sorted.length) return { matches: [], overLimit: false }

  const bestScore = sorted[0].score
  const scoreWindow = bestScore === 0 ? 0 : 0.08
  const closeMatches = sorted.filter((match) => match.score <= bestScore + scoreWindow)

  return {
    matches: closeMatches
      .slice(0, FUZZY_MATCH_LIMIT)
      .map((match) => match.value),
    overLimit: closeMatches.length > FUZZY_MATCH_LIMIT,
  }
}

function selectRankedTokenMatches<T>(scoredMatches: RankedTokenMatch<T>[]): FuzzyMatchResult<T> {
  const bestByValue = new Map<T, RankedTokenMatch<T>>()

  for (const match of scoredMatches) {
    const previous = bestByValue.get(match.value)
    if (
      !previous ||
      match.matchedTokens > previous.matchedTokens ||
      (match.matchedTokens === previous.matchedTokens && match.score < previous.score)
    ) {
      bestByValue.set(match.value, match)
    }
  }

  const sorted = Array.from(bestByValue.values()).sort(
    (a, b) => b.matchedTokens - a.matchedTokens || a.score - b.score || a.rowIndex - b.rowIndex
  )

  return {
    matches: sorted
      .slice(0, FUZZY_MATCH_LIMIT)
      .map((match) => match.value),
    overLimit: sorted.length > FUZZY_MATCH_LIMIT,
  }
}

export function findExactRsvpMatches<T>(rows: RsvpMatchableRow<T>[], input: RsvpLookupInput): T[] {
  const fullName = normalizeInvitationName(input.fullName)
  const zipCode = normalizeZipCode(input.zipCode || '')

  if (!fullName) return []

  return rows.reduce<T[]>((matches, row) => {
    const rowNameCandidates = buildInvitationNameCandidates(row.firstName, row.lastName)
    const rowZipCode = normalizeZipCode(row.zipCode)

    if (rowNameCandidates.has(fullName) && (!zipCode || rowZipCode === zipCode)) {
      matches.push(row.value)
    }

    return matches
  }, [])
}

function findFullNameFuzzyRsvpMatches<T>(rows: RsvpMatchableRow<T>[], input: RsvpLookupInput): FuzzyMatchResult<T> {
  const query = normalizeSearchName(input.fullName)
  const zipCode = normalizeZipCode(input.zipCode || '')
  const tokens = query.split(' ').filter(Boolean)
  const lastNameOnly = tokens.length === 1

  if (!query || tokens.length === 0) return { matches: [], overLimit: false }

  const scoredMatches = rows.reduce<ScoredMatch<T>[]>((matches, row, rowIndex) => {
    if (zipCode && normalizeZipCode(row.zipCode) !== zipCode) return matches

    const candidates = lastNameOnly
      ? buildLastNameSearchCandidates(row.lastName)
      : buildFullNameSearchCandidates(row.firstName, row.lastName)

    for (const candidate of candidates) {
      const score = scoreNameCandidate(query, candidate, lastNameOnly)
      if (score != null) matches.push({ value: row.value, score, rowIndex })
    }

    return matches
  }, [])

  return selectCloseMatches(scoredMatches)
}

function findTokenFallbackRsvpMatches<T>(rows: RsvpMatchableRow<T>[], input: RsvpLookupInput): FuzzyMatchResult<T> {
  const queryTokens = Array.from(new Set(buildSearchTokens(input.fullName)))
    .filter((token) => token.length >= MIN_FUZZY_TOKEN_LENGTH)
  const zipCode = normalizeZipCode(input.zipCode || '')

  if (queryTokens.length === 0) return { matches: [], overLimit: false }

  const scoredMatches = rows.reduce<RankedTokenMatch<T>[]>((matches, row, rowIndex) => {
    if (zipCode && normalizeZipCode(row.zipCode) !== zipCode) return matches

    const rowTokens = buildRowSearchTokens(row.firstName, row.lastName)
      .filter((token) => token.length >= MIN_FUZZY_TOKEN_LENGTH)
    let matchedTokens = 0
    let score = 0

    for (const queryToken of queryTokens) {
      let bestScore: number | null = null

      for (const rowToken of rowTokens) {
        const tokenScore = scoreTokenCandidate(queryToken, rowToken)
        if (tokenScore != null && (bestScore == null || tokenScore < bestScore)) {
          bestScore = tokenScore
        }
      }

      if (bestScore != null) {
        matchedTokens += 1
        score += bestScore
      }
    }

    if (matchedTokens > 0) {
      matches.push({ value: row.value, score: score / matchedTokens, rowIndex, matchedTokens })
    }

    return matches
  }, [])

  return selectRankedTokenMatches(scoredMatches)
}

function findSafeFuzzyRsvpMatches<T>(rows: RsvpMatchableRow<T>[], input: RsvpLookupInput): FuzzyMatchResult<T> {
  const fullNameMatches = findFullNameFuzzyRsvpMatches(rows, input)
  if (fullNameMatches.matches.length > 0 || fullNameMatches.overLimit) return fullNameMatches

  return findTokenFallbackRsvpMatches(rows, input)
}

export function findRsvpMatchByKey<T>(
  rows: RsvpMatchableRow<T>[],
  expectedKey: string,
  keyForValue: (value: T) => string,
  keysEqual: (value: string, expected: string) => boolean = (value, expected) => value === expected
): T | null {
  for (const row of rows) {
    if (keysEqual(keyForValue(row.value), expectedKey)) return row.value
  }

  return null
}

export function resolveRsvpLookupMatches<T>(
  rows: RsvpMatchableRow<T>[],
  input: RsvpLookupInput
): RsvpLookupResolution<T> {
  const hasZipCode = !!normalizeZipCode(input.zipCode || '')
  const exactMatches = findExactRsvpMatches(rows, input)

  if (exactMatches.length > 1 && !hasZipCode) return { status: 'duplicate', hasZipCode }
  if (exactMatches.length > 0) {
    return {
      status: 'matched',
      matches: exactMatches,
      requiresConfirmation: exactMatches.length > 1,
      hasZipCode,
      strategy: 'exact',
    }
  }

  const fuzzyResult = findSafeFuzzyRsvpMatches(rows, input)

  if (fuzzyResult.matches.length === 0) return { status: 'not-found', hasZipCode }
  if (fuzzyResult.overLimit && !hasZipCode) return { status: 'duplicate', hasZipCode }

  return {
    status: 'matched',
    matches: fuzzyResult.matches,
    requiresConfirmation: true,
    hasZipCode,
    strategy: 'fuzzy',
  }
}
