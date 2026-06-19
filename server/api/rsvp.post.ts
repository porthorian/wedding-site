import { createError, defineEventHandler, readBody } from 'h3'
import {
  GoogleSheetsConfigError,
  GoogleSheetsRequestError,
  GoogleSheetsSchemaError,
  RsvpGuestValidationError,
  RsvpGuestDuplicateError,
  RsvpGuestNotFoundError,
  updateRsvpGuest,
  type WillAttend,
} from '../services/googleSheets'
import { sendRsvpDiscordNotification } from '../services/discordRsvp'
import { verifyRecaptchaToken } from '../services/recaptcha'
import { RSVP_CLOSED_MESSAGE, isRsvpClosed } from '#shared/rsvpDeadline'

type RsvpRequestBody = {
  fullName?: unknown
  zipCode?: unknown
  matchToken?: unknown
  willAttend?: unknown
  guestsAttending?: unknown
  attendingNamedGuests?: unknown
  guestNames?: unknown
  captchaToken?: unknown
}

function readStringField(
  body: RsvpRequestBody,
  field: keyof RsvpRequestBody,
  opts: { required?: boolean; maxLen: number }
): string | undefined {
  const value = body[field]

  if (value == null) {
    if (opts.required) throw createError({ statusCode: 400, statusMessage: `${String(field)} is required` })
    return undefined
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} must be a string` })
  }

  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) {
    if (opts.required) throw createError({ statusCode: 400, statusMessage: `${String(field)} is required` })
    return undefined
  }

  if (trimmed.length > opts.maxLen) {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} is too long` })
  }

  return trimmed
}

function readWillAttendField(body: RsvpRequestBody): WillAttend {
  const value = body.willAttend
  if (typeof value === 'boolean') return value ? 'yes' : 'no'

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'yes' || normalized === 'no') return normalized
  }

  throw createError({ statusCode: 400, statusMessage: 'willAttend must be "yes" or "no"' })
}

function readGuestsAttendingField(body: RsvpRequestBody, willAttend: WillAttend): number {
  if (willAttend === 'no') return 0

  const value = body.guestsAttending
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isSafeInteger(parsed)) return parsed
  }

  throw createError({ statusCode: 400, statusMessage: 'guestsAttending must be a non-negative whole number' })
}

function readStringArrayField(body: RsvpRequestBody, field: 'guestNames' | 'attendingNamedGuests'): string[] {
  const value = body[field]
  if (value == null) return []

  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: `${field} must be an array` })
  }

  return value.map((name, index) => {
    if (typeof name !== 'string') {
      throw createError({ statusCode: 400, statusMessage: `${field}[${index}] must be a string` })
    }

    const trimmed = name.trim().replace(/\s+/g, ' ')
    if (!trimmed) {
      throw createError({ statusCode: 400, statusMessage: `Each entry in ${field} must be a non-empty string` })
    }

    if (trimmed.length > 120) {
      throw createError({ statusCode: 400, statusMessage: `Each entry in ${field} must be 120 characters or fewer` })
    }

    return trimmed
  })
}

function captchaError(captcha: Awaited<ReturnType<typeof verifyRecaptchaToken>>): never {
  if (captcha.ok) {
    throw createError({ statusCode: 500, statusMessage: 'Unexpected captcha state' })
  }

  const statusCode =
    captcha.reason === 'not_configured'
      ? 503
      : captcha.reason === 'http_error' || captcha.reason === 'network_error'
        ? 502
        : 401

  const statusMessage =
    captcha.reason === 'not_configured'
      ? 'Captcha not configured'
      : captcha.reason === 'http_error' || captcha.reason === 'network_error'
        ? 'Captcha verification unavailable'
        : 'Captcha verification failed'

  throw createError({ statusCode, statusMessage })
}

function sheetsError(err: unknown): never {
  if (err instanceof GoogleSheetsConfigError) {
    throw createError({ statusCode: 503, statusMessage: err.message })
  }

  if (err instanceof GoogleSheetsSchemaError) {
    throw createError({ statusCode: 503, statusMessage: err.message })
  }

  if (err instanceof RsvpGuestNotFoundError) {
    throw createError({ statusCode: 404, statusMessage: err.message })
  }

  if (err instanceof RsvpGuestDuplicateError) {
    throw createError({ statusCode: 409, statusMessage: err.message })
  }

  if (err instanceof RsvpGuestValidationError) {
    throw createError({ statusCode: 400, statusMessage: err.message })
  }

  if (err instanceof GoogleSheetsRequestError) {
    throw createError({ statusCode: 502, statusMessage: err.message })
  }

  throw err
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'
  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  if (isRsvpClosed()) {
    throw createError({ statusCode: 403, statusMessage: RSVP_CLOSED_MESSAGE })
  }

  const body = (await readBody(event)) as RsvpRequestBody

  const captchaToken = readStringField(body, 'captchaToken', { required: false, maxLen: 4096 }) || ''
  const fullName = readStringField(body, 'fullName', { required: true, maxLen: 160 })!
  const zipCode = readStringField(body, 'zipCode', { required: false, maxLen: 20 })
  const matchToken = readStringField(body, 'matchToken', { required: false, maxLen: 4096 })
  const willAttend = readWillAttendField(body)
  const guestsAttending = readGuestsAttendingField(body, willAttend)
  const attendingNamedGuests = willAttend === 'yes' ? readStringArrayField(body, 'attendingNamedGuests') : []
  const guestNames = willAttend === 'yes' ? readStringArrayField(body, 'guestNames') : []

  const captcha = await verifyRecaptchaToken(event, captchaToken)
  if (!captcha.ok) captchaError(captcha)

  try {
    const { guest, notification } = await updateRsvpGuest(event, {
      fullName,
      zipCode,
      matchToken,
      willAttend,
      guestsAttending,
      attendingNamedGuests,
      guestNames,
      submittedAtISO: new Date().toISOString(),
    })
    void sendRsvpDiscordNotification(event, notification)

    return {
      ok: true,
      stored: true,
      guest,
      captcha: {
        bypassed: captcha.bypassed === true,
        score: captcha.score ?? null,
        action: captcha.action ?? null,
      },
    }
  } catch (err) {
    sheetsError(err)
  }
})
