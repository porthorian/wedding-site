import { createError, defineEventHandler, readBody } from 'h3'
import { appendRsvpRow, type RsvpSubmission } from '../services/googleSheets'
import { verifyRecaptchaToken } from '../services/recaptcha'

type RsvpRequestBody = {
  name?: unknown
  email?: unknown
  willAttend?: unknown
  address?: unknown
  numberOfGuests?: unknown
  dietaryRestrictions?: unknown
  songRequest?: unknown
  message?: unknown
  captchaToken?: unknown
}

function readStringField(
  body: RsvpRequestBody,
  field: keyof RsvpRequestBody,
  opts: { required?: boolean; maxLen: number }
): string | undefined {
  const value = body[field]

  if (value == null) {
    if (opts.required) {
      throw createError({ statusCode: 400, statusMessage: `${String(field)} is required` })
    }
    return undefined
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} must be a string` })
  }

  const trimmed = value.trim()
  if (!trimmed) {
    if (opts.required) {
      throw createError({ statusCode: 400, statusMessage: `${String(field)} is required` })
    }
    return undefined
  }

  if (trimmed.length > opts.maxLen) {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} is too long` })
  }

  return trimmed
}

function readEmailField(body: RsvpRequestBody): string | undefined {
  const email = readStringField(body, 'email', { required: false, maxLen: 254 })
  if (!email) return undefined

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!isValidEmail) throw createError({ statusCode: 400, statusMessage: 'email must be a valid email address' })

  return email
}

function readWillAttendField(body: RsvpRequestBody): 'yes' | 'no' {
  const value = body.willAttend
  if (typeof value === 'boolean') return value ? 'yes' : 'no'

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'yes' || normalized === 'no') return normalized
  }

  throw createError({ statusCode: 400, statusMessage: 'willAttend must be "yes" or "no"' })
}

function readIntegerField(
  body: RsvpRequestBody,
  field: keyof RsvpRequestBody,
  opts: { min: number; max: number }
): number {
  const value = body[field]
  if (value == null) {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} is required` })
  }

  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  if (!Number.isFinite(parsed)) {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} must be a number` })
  }

  const normalized = Math.trunc(parsed)
  if (normalized < opts.min || normalized > opts.max) {
    throw createError({ statusCode: 400, statusMessage: `${String(field)} must be between ${opts.min} and ${opts.max}` })
  }

  return normalized
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'
  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const body = (await readBody(event)) as RsvpRequestBody

  const captchaToken = readStringField(body, 'captchaToken', { required: false, maxLen: 4096 }) || ''
  const name = readStringField(body, 'name', { required: true, maxLen: 120 })!
  const email = readEmailField(body)
  const willAttend = readWillAttendField(body)
  const address = readStringField(body, 'address', { required: false, maxLen: 300 })
  const numberOfGuests = readIntegerField(body, 'numberOfGuests', { min: 0, max: 20 })
  const dietaryRestrictions = readStringField(body, 'dietaryRestrictions', { required: false, maxLen: 500 })
  const songRequest = readStringField(body, 'songRequest', { required: false, maxLen: 200 })
  const message = readStringField(body, 'message', { required: false, maxLen: 2000 })

  const captcha = await verifyRecaptchaToken(event, captchaToken)
  if (!captcha.ok) {
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

  const submission: RsvpSubmission = {
    name,
    email,
    willAttend,
    address,
    numberOfGuests,
    dietaryRestrictions,
    songRequest,
    message,
    submittedAtISO: new Date().toISOString(),
  }

  const sheetsResult = await appendRsvpRow(event, submission)

  return {
    ok: true,
    stored: true,
    mockedSheets: sheetsResult.mocked,
    captcha: {
      bypassed: captcha.bypassed === true,
      score: captcha.score ?? null,
      action: captcha.action ?? null,
    },
  }
})
