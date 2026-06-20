import { createHmac, createSign, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import {
  findExactRsvpMatches,
  findRsvpMatchByKey,
  normalizeInvitationName,
  normalizeZipCode,
  resolveRsvpLookupMatches,
  type RsvpMatchableRow,
} from './rsvpMatching'

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
  // Count of people explicitly named on the invitation. Blank or 0 means names are collected during RSVP.
  'Named Guests Count',
  // Count of additional unnamed guests, or total capacity when no guests are named.
  'Guests Eligible',
  // RSVP answer for the invitation: "yes" or "no".
  'Will Attend',
  // Total number of people attending, including named guests and extra guests.
  'Guests Attending',
  // Newline-separated names collected during RSVP.
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
  namedGuests: string[]
  namedGuestsCount: number
  extraGuestsAllowed: number
  totalGuestCapacity: number
  willAttend: WillAttend | null
  guestsAttending: number
  guestNames: string[]
}

export type RsvpGuestMatch = {
  guest: RsvpGuest
  matchToken: string
}

export type RsvpLookupResult =
  | (RsvpGuestMatch & { matches?: never })
  | { matches: RsvpGuestMatch[] }

export type RsvpUpdateInput = RsvpLookupInput & {
  matchToken?: string
  willAttend: WillAttend
  guestsAttending: number
  attendingNamedGuests: string[]
  guestNames: string[]
  submittedAtISO: string
}

export type RsvpUpdateNotification = {
  kind: 'new' | 'updated'
  guest: RsvpGuest
  submittedAtISO: string
  updatedAtISO: string
}

export type RsvpUpdateResult = {
  guest: RsvpGuest
  notification: RsvpUpdateNotification | null
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

type MatchTokenPayload = {
  v: 1
  spreadsheetId: string
  worksheetName: string
  fullName: string
  zipCode: string
  matchKey: string
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
const MATCH_TOKEN_ERROR = 'Please look up your invitation again before submitting your RSVP.'

function base64UrlEncode(value: string | Buffer): string {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, 'base64')
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value)
  const expectedBuffer = Buffer.from(expected)
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer)
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
  return parseNonNegativeInteger(value)
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

function buildDisplayName(firstName: string, lastName: string): string {
  const firstParts = firstName.split('&').map(s => s.trim()).filter(Boolean)
  const lastParts = lastName.split('&').map(s => s.trim()).filter(Boolean)
  if (firstParts.length > 0 && firstParts.length === lastParts.length) {
    return firstParts.map((f, i) => `${f} ${lastParts[i]}`).join(' & ')
  }
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

function parseNamedGuests(firstName: string, lastName: string): string[] {
  const firstParts = firstName.split('&').map(s => s.trim()).filter(Boolean)
  const lastParts = lastName.split('&').map(s => s.trim()).filter(Boolean)
  if (firstParts.length > 0 && firstParts.length === lastParts.length) {
    return firstParts.map((f, i) => `${f} ${lastParts[i]}`.trim())
  }
  if (firstParts.length > 1 && lastParts.length === 1) {
    return firstParts.map((f) => `${f} ${lastParts[0]}`.trim())
  }
  return [buildDisplayName(firstName, lastName)].filter(Boolean)
}

function mapGuest(row: string[], columns: Record<RequiredColumn, number>): RsvpGuest {
  const firstName = cell(row, columns['First Name'])
  const lastName = cell(row, columns['Last Name'])
  const displayName = buildDisplayName(firstName, lastName)
  const namedGuestsCount = parseNamedGuestsCount(cell(row, columns['Named Guests Count']))
  const namedGuests = namedGuestsCount > 0 ? parseNamedGuests(firstName, lastName) : []
  const extraGuestsAllowed = parseNonNegativeInteger(cell(row, columns['Guests Eligible']))
  const totalGuestCapacity = namedGuestsCount > 0
    ? namedGuestsCount + extraGuestsAllowed
    : extraGuestsAllowed

  return {
    firstName,
    lastName,
    displayName,
    namedGuests,
    namedGuestsCount,
    extraGuestsAllowed,
    totalGuestCapacity,
    willAttend: parseWillAttend(cell(row, columns['Will Attend'])),
    guestsAttending: parseNonNegativeInteger(cell(row, columns['Guests Attending'])),
    guestNames: parseGuestNames(cell(row, columns['Guests Names'])),
  }
}

function getMatchableRows(rows: SheetRows): RsvpMatchableRow<MatchingGuestRow>[] {
  return rows.rows.map((row, rowIndex) => {
    const firstName = cell(row, rows.columns['First Name'])
    const lastName = cell(row, rows.columns['Last Name'])
    const rowZipCode = normalizeZipCode(cell(row, rows.columns['ZIP Code']))

    return {
      value: {
        rowNumber: rowIndex + DATA_ROW_START,
        row,
        guest: mapGuest(row, rows.columns),
      },
      firstName,
      lastName,
      zipCode: rowZipCode,
    }
  })
}

function findMatchingRows(rows: SheetRows, input: RsvpLookupInput): MatchingGuestRow[] {
  return findExactRsvpMatches(getMatchableRows(rows), input)
}

function matchTokenSecret(config: SheetsConfig): string {
  return `${config.privateKey}\n${config.spreadsheetId}\n${config.worksheetName}`
}

function createMatchKey(config: SheetsConfig, rows: SheetRows, match: MatchingGuestRow): string {
  const firstName = cell(match.row, rows.columns['First Name'])
  const lastName = cell(match.row, rows.columns['Last Name'])
  const zipCode = normalizeZipCode(cell(match.row, rows.columns['ZIP Code']))

  return base64UrlEncode(
    createHmac('sha256', matchTokenSecret(config))
      .update([match.rowNumber, firstName, lastName, zipCode].join('\n'))
      .digest()
  )
}

function buildMatchTokenPayload(
  config: SheetsConfig,
  rows: SheetRows,
  input: RsvpLookupInput,
  match: MatchingGuestRow
): MatchTokenPayload {
  return {
    v: 1,
    spreadsheetId: config.spreadsheetId,
    worksheetName: config.worksheetName,
    fullName: normalizeInvitationName(input.fullName),
    zipCode: normalizeZipCode(input.zipCode || ''),
    matchKey: createMatchKey(config, rows, match),
  }
}

function signMatchTokenPayload(config: SheetsConfig, encodedPayload: string): string {
  return base64UrlEncode(createHmac('sha256', matchTokenSecret(config)).update(encodedPayload).digest())
}

function createMatchToken(config: SheetsConfig, rows: SheetRows, input: RsvpLookupInput, match: MatchingGuestRow): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(buildMatchTokenPayload(config, rows, input, match)))
  return `${encodedPayload}.${signMatchTokenPayload(config, encodedPayload)}`
}

function readMatchTokenPayload(config: SheetsConfig, input: RsvpLookupInput, matchToken: string): MatchTokenPayload {
  const [encodedPayload, signature, extra] = matchToken.trim().split('.')
  if (!encodedPayload || !signature || extra) {
    throw new RsvpGuestValidationError(MATCH_TOKEN_ERROR)
  }

  const expectedSignature = signMatchTokenPayload(config, encodedPayload)
  if (!safeEqual(signature, expectedSignature)) {
    throw new RsvpGuestValidationError(MATCH_TOKEN_ERROR)
  }

  let payload: MatchTokenPayload
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as MatchTokenPayload
  } catch {
    throw new RsvpGuestValidationError(MATCH_TOKEN_ERROR)
  }

  const matchesRequest =
    payload?.v === 1 &&
    payload.spreadsheetId === config.spreadsheetId &&
    payload.worksheetName === config.worksheetName &&
    payload.fullName === normalizeInvitationName(input.fullName) &&
    payload.zipCode === normalizeZipCode(input.zipCode || '') &&
    typeof payload.matchKey === 'string' &&
    payload.matchKey.length > 0

  if (!matchesRequest) {
    throw new RsvpGuestValidationError(MATCH_TOKEN_ERROR)
  }

  return payload
}

function createRsvpGuestMatch(config: SheetsConfig, rows: SheetRows, input: RsvpLookupInput, match: MatchingGuestRow): RsvpGuestMatch {
  return {
    guest: match.guest,
    matchToken: createMatchToken(config, rows, input, match),
  }
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

function getMatchingRowsOrThrow(rows: SheetRows, input: RsvpLookupInput): { matches: MatchingGuestRow[]; hasZipCode: boolean } {
  const matches = findMatchingRows(rows, input)
  const hasZipCode = !!normalizeZipCode(input.zipCode || '')

  if (matches.length === 0) {
    throw new RsvpGuestNotFoundError(
      hasZipCode
        ? "We couldn't match that invitation name and ZIP Code. Please check both and try again."
        : undefined
    )
  }

  return { matches, hasZipCode }
}

function getLookupGuestMatches(rows: SheetRows, input: RsvpLookupInput): {
  matches: MatchingGuestRow[]
  requiresConfirmation: boolean
} {
  const result = resolveRsvpLookupMatches(getMatchableRows(rows), input)

  if (result.status === 'not-found') {
    throw new RsvpGuestNotFoundError(
      result.hasZipCode
        ? "We couldn't match that invitation name and ZIP Code. Please check both and try again."
        : undefined
    )
  }

  if (result.status === 'duplicate') {
    throw new RsvpGuestDuplicateError(
      'We found more than one invitation for that name. Please enter the ZIP Code from your mailing address.'
    )
  }

  return {
    matches: result.matches,
    requiresConfirmation: result.requiresConfirmation,
  }
}

function getSingleGuestMatch(rows: SheetRows, input: RsvpLookupInput): MatchingGuestRow {
  const { matches, hasZipCode } = getMatchingRowsOrThrow(rows, input)

  if (matches.length > 1) {
    throw new RsvpGuestDuplicateError(
      hasZipCode
        ? 'We still found more than one invitation for that name and ZIP Code. Please choose your invitation and try again.'
        : 'We found more than one invitation for that name. Please enter the ZIP Code from your mailing address.'
    )
  }

  return matches[0]
}

function getTokenGuestMatch(config: SheetsConfig, rows: SheetRows, input: RsvpLookupInput & { matchToken: string }): MatchingGuestRow {
  const payload = readMatchTokenPayload(config, input, input.matchToken)
  const match = findRsvpMatchByKey(
    getMatchableRows(rows),
    payload.matchKey,
    (candidate) => createMatchKey(config, rows, candidate),
    safeEqual
  )

  if (!match) {
    throw new RsvpGuestValidationError(MATCH_TOKEN_ERROR)
  }

  return match
}

function getUpdateGuestMatch(config: SheetsConfig, rows: SheetRows, input: RsvpUpdateInput): MatchingGuestRow {
  const matchToken = input.matchToken?.trim()
  if (matchToken) return getTokenGuestMatch(config, rows, { ...input, matchToken })
  return getSingleGuestMatch(rows, input)
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

function stringArraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function hasRsvpResponseChanged(previous: RsvpGuest, next: RsvpGuest): boolean {
  return (
    previous.willAttend !== next.willAttend ||
    previous.guestsAttending !== next.guestsAttending ||
    !stringArraysEqual(previous.guestNames, next.guestNames)
  )
}

export async function findRsvpGuest(event: H3Event, input: RsvpLookupInput): Promise<RsvpGuest> {
  const { rows } = await getSheetRows(event)
  return getSingleGuestMatch(rows, input).guest
}

export async function findRsvpGuestLookup(event: H3Event, input: RsvpLookupInput): Promise<RsvpLookupResult> {
  const { config, rows } = await getSheetRows(event)
  const lookup = getLookupGuestMatches(rows, input)
  const matches = lookup.matches.map((match) => createRsvpGuestMatch(config, rows, input, match))

  if (!lookup.requiresConfirmation && matches.length === 1) return matches[0]
  return { matches }
}

export async function updateRsvpGuest(event: H3Event, input: RsvpUpdateInput): Promise<RsvpUpdateResult> {
  const { config, rows } = await getSheetRows(event)
  const match = getUpdateGuestMatch(config, rows, input)
  const guest = match.guest
  const now = input.submittedAtISO
  const willAttend = input.willAttend
  const guestsAttending = willAttend === 'yes' ? input.guestsAttending : 0
  const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ')
  const guestNames = willAttend === 'yes' ? input.guestNames.map(cleanName) : []
  const attendingNamedGuests = willAttend === 'yes' && guest.namedGuestsCount > 0
    ? input.attendingNamedGuests.map(cleanName)
    : []
  const additionalGuestsAttending = Math.max(0, guestsAttending - guest.namedGuestsCount)
  const partialNamedAttending = guestsAttending < guest.namedGuestsCount
  const previousSubmittedAt = cell(match.row, rows.columns['Submitted At'])
  const submittedAt = previousSubmittedAt || now

  if (!Number.isSafeInteger(guestsAttending) || guestsAttending < 0) {
    throw new RsvpGuestValidationError('Please choose a valid number of guests attending.')
  }

  if (willAttend === 'yes' && guestsAttending < 1) {
    throw new RsvpGuestValidationError('Please choose how many people will attend.')
  }

  if (guestsAttending > guest.totalGuestCapacity) {
    throw new RsvpGuestValidationError('That response includes more guests than your invitation allows.')
  }

  if (partialNamedAttending && attendingNamedGuests.length !== guestsAttending) {
    throw new RsvpGuestValidationError('Please select which guests will be attending.')
  }

  if (guestNames.length !== additionalGuestsAttending) {
    throw new RsvpGuestValidationError(
      guest.namedGuestsCount === 0
        ? 'Please enter a name for each guest.'
        : 'Please enter a name for each additional guest.'
    )
  }

  const hasInvalidGuestName = guestNames.some((name) => !name || name.length > 120)
  if (hasInvalidGuestName) {
    throw new RsvpGuestValidationError(
      guest.namedGuestsCount === 0
        ? 'Each guest name must be 120 characters or fewer.'
        : 'Each additional guest name must be 120 characters or fewer.'
    )
  }

  const allGuestNames = [...attendingNamedGuests, ...guestNames]
  const updatedGuest: RsvpGuest = {
    ...guest,
    willAttend,
    guestsAttending,
    guestNames: allGuestNames,
  }

  const updates: Array<{ column: RequiredColumn; value: string }> = [
    { column: 'Will Attend', value: willAttend },
    { column: 'Guests Attending', value: String(guestsAttending) },
    { column: 'Guests Names', value: allGuestNames.join('\n') },
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

  const notificationKind = !previousSubmittedAt
    ? 'new'
    : hasRsvpResponseChanged(guest, updatedGuest)
      ? 'updated'
      : null

  return {
    guest: updatedGuest,
    notification: notificationKind
      ? {
          kind: notificationKind,
          guest: updatedGuest,
          submittedAtISO: submittedAt,
          updatedAtISO: now,
        }
      : null,
  }
}
