import { createSign } from 'node:crypto'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

const REQUIRED_COLUMNS = [
  // First name or first-name group printed on the invitation.
  'First Name',
  // Last name or last-name group printed on the invitation.
  'Last Name',
  // Mailing ZIP used only to disambiguate duplicate invitation names.
  'ZIP Code',
  // Count of people explicitly named on the invitation.
  'Named Guests Count',
  // Count of additional unnamed guests this invitation may bring.
  'Guests Eligible',
  // RSVP answer for the invitation: "yes" or "no".
  'Will Attend',
  // Total number of people attending, including named guests and extra guests.
  'Guests Attending',
  // Newline-separated names for additional unnamed guests only.
  'Guests Names',
  // Timestamp from the first successful RSVP submission.
  'Submitted At',
  // Timestamp from the most recent RSVP update.
  'Updated At',
] as const

const DATA_ROW_START = 3

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number]

export type WillAttend = 'yes' | 'no'

export type RsvpLookupInput = {
  fullName: string
  zipCode?: string
}

export type RsvpGuest = {
  firstName: string
  lastName: string
  displayName: string
  namedGuestsCount: number
  extraGuestsAllowed: number
  totalGuestCapacity: number
  willAttend: WillAttend | null
  guestsAttending: number
  guestNames: string[]
}

export type RsvpUpdateInput = RsvpLookupInput & {
  willAttend: WillAttend
  guestsAttending: number
  guestNames: string[]
  submittedAtISO: string
}

type GoogleSheetsRuntimeConfig = {
  spreadsheetId?: string
  worksheetName?: string
  clientEmail?: string
  privateKey?: string
}

type SheetsConfig = {
  spreadsheetId: string
  worksheetName: string
  clientEmail: string
  privateKey: string
}

type TokenResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

type ValuesResponse = {
  range?: string
  majorDimension?: string
  values?: string[][]
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

type SheetRows = {
  headers: string[]
  columns: Record<RequiredColumn, number>
  rows: string[][]
}

type MatchingGuestRow = {
  rowNumber: number
  row: string[]
  guest: RsvpGuest
}

export class GoogleSheetsConfigError extends Error {
  constructor(message = 'Google Sheets is not configured') {
    super(message)
    this.name = 'GoogleSheetsConfigError'
  }
}

export class GoogleSheetsSchemaError extends Error {
  constructor(message = 'Google Sheets is missing required RSVP columns') {
    super(message)
    this.name = 'GoogleSheetsSchemaError'
  }
}

export class GoogleSheetsRequestError extends Error {
  constructor(message = 'Google Sheets request failed') {
    super(message)
    this.name = 'GoogleSheetsRequestError'
  }
}

export class RsvpGuestNotFoundError extends Error {
  constructor(message = "We couldn't find your invitation. Please check your name and try again.") {
    super(message)
    this.name = 'RsvpGuestNotFoundError'
  }
}

export class RsvpGuestDuplicateError extends Error {
  constructor(message = 'We found more than one invitation for that name. Please contact Rosa or Vincent for help.') {
    super(message)
    this.name = 'RsvpGuestDuplicateError'
  }
}

export class RsvpGuestValidationError extends Error {
  constructor(message = 'RSVP response is invalid') {
    super(message)
    this.name = 'RsvpGuestValidationError'
  }
}

let cachedToken: { accessToken: string; expiresAtMs: number; cacheKey: string } | null = null

function base64UrlEncode(value: string | Buffer): string {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeInvitationName(value: string): string {
  return normalizeName(value).replace(/&/g, ' and ').replace(/\s+/g, ' ')
}

function splitInvitationNameGroup(value: string): string[] {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(/\s*(?:&|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

function buildInvitationNameCandidates(firstName: string, lastName: string): Set<string> {
  const candidates = new Set<string>()
  const addCandidate = (value: string) => {
    const normalized = normalizeInvitationName(value)
    if (normalized) candidates.add(normalized)
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

function normalizeZipCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.trim().replace(/\\n/g, '\n')
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readSheetsConfig(event: H3Event): SheetsConfig {
  const config = useRuntimeConfig(event)
  const sheetsConfig = config.googleSheets as GoogleSheetsRuntimeConfig | undefined

  const spreadsheetId = readString(sheetsConfig?.spreadsheetId)
  const worksheetName = readString(sheetsConfig?.worksheetName) || 'RSVPs'
  const clientEmail = readString(sheetsConfig?.clientEmail)
  const privateKey = normalizePrivateKey(readString(sheetsConfig?.privateKey))

  if (!spreadsheetId || !worksheetName || !clientEmail || !privateKey) {
    throw new GoogleSheetsConfigError()
  }

  return { spreadsheetId, worksheetName, clientEmail, privateKey }
}

function buildJwt(config: SheetsConfig): string {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64UrlEncode(
    JSON.stringify({
      iss: config.clientEmail,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    })
  )
  const unsignedToken = `${header}.${claims}`
  const signature = createSign('RSA-SHA256').update(unsignedToken).sign(config.privateKey)

  return `${unsignedToken}.${base64UrlEncode(signature)}`
}

async function getAccessToken(config: SheetsConfig): Promise<string> {
  const cacheKey = `${config.clientEmail}:${config.spreadsheetId}`
  if (cachedToken && cachedToken.cacheKey === cacheKey && cachedToken.expiresAtMs > Date.now() + 60_000) {
    return cachedToken.accessToken
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildJwt(config),
    }),
  })

  let data: TokenResponse = {}
  try {
    data = (await response.json()) as TokenResponse
  } catch {
    // Fall through to the response.ok check with an empty payload.
  }

  if (!response.ok || !data.access_token) {
    throw new GoogleSheetsRequestError(data.error_description || data.error || 'Google authentication failed')
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAtMs: Date.now() + Math.max(60, data.expires_in || 3600) * 1000,
    cacheKey,
  }

  return data.access_token
}

function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'`
}

async function sheetsFetch<T>(
  config: SheetsConfig,
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const accessToken = await getAccessToken(config)
  const response = await fetch(`${SHEETS_API_BASE}/${encodeURIComponent(config.spreadsheetId)}${path}`, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = (data as ValuesResponse | null)?.error?.message || 'Google Sheets request failed'
    throw new GoogleSheetsRequestError(message)
  }

  return data as T
}

function parseWillAttend(value: string): WillAttend | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'yes') return 'yes'
  if (normalized === 'no') return 'no'
  return null
}

function parseNonNegativeInteger(value: string): number {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return 0
  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) ? parsed : 0
}

function parseNamedGuestsCount(value: string): number {
  return Math.max(1, parseNonNegativeInteger(value))
}

function parseGuestNames(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((name) => name.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
}

function buildColumns(headers: string[]): Record<RequiredColumn, number> {
  const normalizedHeaders = new Map(headers.map((header, index) => [normalizeHeader(header), index]))
  const missing = REQUIRED_COLUMNS.filter((column) => !normalizedHeaders.has(normalizeHeader(column)))
  if (missing.length) {
    throw new GoogleSheetsSchemaError(`Google Sheets is missing required columns: ${missing.join(', ')}`)
  }

  return REQUIRED_COLUMNS.reduce(
    (columns, column) => {
      columns[column] = normalizedHeaders.get(normalizeHeader(column))!
      return columns
    },
    {} as Record<RequiredColumn, number>
  )
}

function cell(row: string[], index: number): string {
  return typeof row[index] === 'string' ? row[index].trim() : ''
}

function mapGuest(row: string[], columns: Record<RequiredColumn, number>): RsvpGuest {
  const firstName = cell(row, columns['First Name'])
  const lastName = cell(row, columns['Last Name'])
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const namedGuestsCount = parseNamedGuestsCount(cell(row, columns['Named Guests Count']))
  const extraGuestsAllowed = parseNonNegativeInteger(cell(row, columns['Guests Eligible']))
  const totalGuestCapacity = namedGuestsCount + extraGuestsAllowed

  return {
    firstName,
    lastName,
    displayName,
    namedGuestsCount,
    extraGuestsAllowed,
    totalGuestCapacity,
    willAttend: parseWillAttend(cell(row, columns['Will Attend'])),
    guestsAttending: parseNonNegativeInteger(cell(row, columns['Guests Attending'])),
    guestNames: parseGuestNames(cell(row, columns['Guests Names'])),
  }
}

function findMatchingRows(rows: SheetRows, input: RsvpLookupInput): MatchingGuestRow[] {
  const fullName = normalizeInvitationName(input.fullName)
  const zipCode = normalizeZipCode(input.zipCode || '')

  return rows.rows.reduce<MatchingGuestRow[]>((matches, row, rowIndex) => {
    const firstName = cell(row, rows.columns['First Name'])
    const lastName = cell(row, rows.columns['Last Name'])
    const rowNameCandidates = buildInvitationNameCandidates(firstName, lastName)
    const rowZipCode = normalizeZipCode(cell(row, rows.columns['ZIP Code']))

    if (rowNameCandidates.has(fullName) && (!zipCode || rowZipCode === zipCode)) {
      matches.push({
        rowNumber: rowIndex + DATA_ROW_START,
        row,
        guest: mapGuest(row, rows.columns),
      })
    }

    return matches
  }, [])
}

async function getSheetRows(event: H3Event): Promise<{ config: SheetsConfig; rows: SheetRows }> {
  const config = readSheetsConfig(event)
  const range = `${quoteSheetName(config.worksheetName)}!A:Z`
  const data = await sheetsFetch<ValuesResponse>(config, `/values/${encodeURIComponent(range)}?majorDimension=ROWS`)
  const values = Array.isArray(data.values) ? data.values : []

  if (values.length === 0) {
    throw new GoogleSheetsSchemaError('Google Sheets worksheet is empty')
  }

  const headers = values[1] || []
  const columns = buildColumns(headers)
  return {
    config,
    rows: {
      headers,
      columns,
      rows: values.slice(DATA_ROW_START - 1),
    },
  }
}

function getSingleGuestMatch(rows: SheetRows, input: RsvpLookupInput): MatchingGuestRow {
  const matches = findMatchingRows(rows, input)
  const hasZipCode = !!normalizeZipCode(input.zipCode || '')

  if (matches.length === 0) {
    throw new RsvpGuestNotFoundError(
      hasZipCode
        ? "We couldn't match that invitation name and ZIP Code. Please check both and try again."
        : undefined
    )
  }

  if (matches.length > 1) {
    throw new RsvpGuestDuplicateError(
      hasZipCode
        ? 'We still found more than one invitation for that name and ZIP Code. Please contact Rosa or Vincent for help.'
        : 'We found more than one invitation for that name. Please enter the ZIP Code from your mailing address.'
    )
  }

  return matches[0]
}

function columnLetter(index: number): string {
  let value = index + 1
  let letters = ''

  while (value > 0) {
    const remainder = (value - 1) % 26
    letters = String.fromCharCode(65 + remainder) + letters
    value = Math.floor((value - 1) / 26)
  }

  return letters
}

export async function findRsvpGuest(event: H3Event, input: RsvpLookupInput): Promise<RsvpGuest> {
  const { rows } = await getSheetRows(event)
  return getSingleGuestMatch(rows, input).guest
}

export async function updateRsvpGuest(event: H3Event, input: RsvpUpdateInput): Promise<RsvpGuest> {
  const { config, rows } = await getSheetRows(event)
  const match = getSingleGuestMatch(rows, input)
  const guest = match.guest
  const now = input.submittedAtISO
  const willAttend = input.willAttend
  const guestsAttending = willAttend === 'yes' ? input.guestsAttending : 0
  const guestNames = willAttend === 'yes' ? input.guestNames.map((name) => name.trim().replace(/\s+/g, ' ')) : []
  const additionalGuestsAttending = Math.max(0, guestsAttending - guest.namedGuestsCount)
  const submittedAt = cell(match.row, rows.columns['Submitted At']) || now

  if (!Number.isSafeInteger(guestsAttending) || guestsAttending < 0) {
    throw new RsvpGuestValidationError('Please choose a valid number of guests attending.')
  }

  if (willAttend === 'yes' && guestsAttending < 1) {
    throw new RsvpGuestValidationError('Please choose how many people will attend.')
  }

  if (guestsAttending > guest.totalGuestCapacity) {
    throw new RsvpGuestValidationError('That response includes more guests than your invitation allows.')
  }

  if (guestNames.length !== additionalGuestsAttending) {
    throw new RsvpGuestValidationError('Please enter a name for each additional guest.')
  }

  const hasInvalidGuestName = guestNames.some((name) => !name || name.length > 120)
  if (hasInvalidGuestName) {
    throw new RsvpGuestValidationError('Each additional guest name must be 120 characters or fewer.')
  }

  const updates: Array<{ column: RequiredColumn; value: string }> = [
    { column: 'Will Attend', value: willAttend },
    { column: 'Guests Attending', value: String(guestsAttending) },
    { column: 'Guests Names', value: guestNames.join('\n') },
    { column: 'Submitted At', value: submittedAt },
    { column: 'Updated At', value: now },
  ]

  await sheetsFetch(config, `/values:batchUpdate`, {
    method: 'POST',
    body: {
      valueInputOption: 'USER_ENTERED',
      data: updates.map((update) => {
        const letter = columnLetter(rows.columns[update.column])
        return {
          range: `${quoteSheetName(config.worksheetName)}!${letter}${match.rowNumber}`,
          values: [[update.value]],
        }
      }),
    },
  })

  return {
    ...guest,
    willAttend,
    guestsAttending,
    guestNames,
  }
}
