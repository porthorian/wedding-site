import { createError, defineEventHandler, readBody } from 'h3'
import {
  findRsvpGuest,
  GoogleSheetsConfigError,
  GoogleSheetsRequestError,
  GoogleSheetsSchemaError,
  RsvpGuestDuplicateError,
  RsvpGuestNotFoundError,
} from '../../services/googleSheets'
import { verifyRecaptchaToken } from '../../services/recaptcha'

type RsvpLookupRequestBody = {
  fullName?: unknown
  zipCode?: unknown
  captchaToken?: unknown
}

function readStringField(
  body: RsvpLookupRequestBody,
  field: keyof RsvpLookupRequestBody,
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

  const body = (await readBody(event)) as RsvpLookupRequestBody
  const captchaToken = readStringField(body, 'captchaToken', { required: false, maxLen: 4096 }) || ''
  const fullName = readStringField(body, 'fullName', { required: true, maxLen: 160 })!
  const zipCode = readStringField(body, 'zipCode', { required: false, maxLen: 20 })

  const captcha = await verifyRecaptchaToken(event, captchaToken)
  if (!captcha.ok) captchaError(captcha)

  try {
    const guest = await findRsvpGuest(event, { fullName, zipCode })

    return {
      ok: true,
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
