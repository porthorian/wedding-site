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

const FUZZY_MATCH_LIMIT = 5
const MIN_FUZZY_LAST_NAME_LENGTH = 4
const MIN_FUZZY_FULL_NAME_LENGTH = 5

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
  return normalizeInvitationName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
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

function selectCloseMatches<T>(scoredMatches: ScoredMatch<T>[]): T[] {
  const bestByValue = new Map<T, ScoredMatch<T>>()

  for (const match of scoredMatches) {
    const previous = bestByValue.get(match.value)
    if (!previous || match.score < previous.score) {
      bestByValue.set(match.value, match)
    }
  }

  const sorted = Array.from(bestByValue.values()).sort((a, b) => a.score - b.score || a.rowIndex - b.rowIndex)
  if (!sorted.length) return []

  const bestScore = sorted[0].score
  const scoreWindow = bestScore === 0 ? 0 : 0.08

  return sorted
    .filter((match) => match.score <= bestScore + scoreWindow)
    .slice(0, FUZZY_MATCH_LIMIT)
    .map((match) => match.value)
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

function findSafeFuzzyRsvpMatches<T>(rows: RsvpMatchableRow<T>[], input: RsvpLookupInput): T[] {
  const query = normalizeSearchName(input.fullName)
  const zipCode = normalizeZipCode(input.zipCode || '')
  const tokens = query.split(' ').filter(Boolean)
  const lastNameOnly = tokens.length === 1

  if (!query || tokens.length === 0) return []

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

  const fuzzyMatches = findSafeFuzzyRsvpMatches(rows, input)

  if (fuzzyMatches.length === 0) return { status: 'not-found', hasZipCode }
  if (fuzzyMatches.length > 1 && !hasZipCode) return { status: 'duplicate', hasZipCode }

  return {
    status: 'matched',
    matches: fuzzyMatches,
    requiresConfirmation: true,
    hasZipCode,
    strategy: 'fuzzy',
  }
}
