import { createError, defineEventHandler, readBody, type H3Event } from 'h3'
import {
  findRsvpGuestLookup,
  GoogleSheetsConfigError,
  GoogleSheetsRequestError,
  GoogleSheetsSchemaError,
  RsvpGuestDuplicateError,
  RsvpGuestNotFoundError,
} from '../../services/googleSheets'
import { sendRsvpDiscordErrorNotification } from '../../services/discordRsvp'
import { verifyRecaptchaToken } from '../../services/recaptcha'
import { RSVP_CLOSED_MESSAGE, isRsvpClosed } from '#shared/rsvpDeadline'

type RsvpLookupRequestBody = {
  fullName?: unknown
  zipCode?: unknown
  captchaToken?: unknown
}

type CaptchaVerifyResult = Awaited<ReturnType<typeof verifyRecaptchaToken>>

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

function throwWithCause(responseError: unknown, cause: unknown): never {
  if (responseError && typeof responseError === 'object' && responseError !== cause) {
    try {
      ;(responseError as { cause?: unknown }).cause = cause
    } catch {
      // Best-effort metadata for internal Discord diagnostics.
    }
  }

  throw responseError
}

function sheetsError(err: unknown): never {
  if (err instanceof GoogleSheetsConfigError) {
    throwWithCause(createError({ statusCode: 503, statusMessage: err.message }), err)
  }

  if (err instanceof GoogleSheetsSchemaError) {
    throwWithCause(createError({ statusCode: 503, statusMessage: err.message }), err)
  }

  if (err instanceof RsvpGuestNotFoundError) {
    throwWithCause(createError({ statusCode: 404, statusMessage: err.message }), err)
  }

  if (err instanceof RsvpGuestDuplicateError) {
    throwWithCause(createError({ statusCode: 409, statusMessage: err.message }), err)
  }

  if (err instanceof GoogleSheetsRequestError) {
    throwWithCause(createError({ statusCode: 502, statusMessage: err.message }), err)
  }

  throw err
}

function notifyRsvpServerError(
  event: H3Event,
  err: unknown,
  context: { body?: RsvpLookupRequestBody; captcha?: CaptchaVerifyResult }
) {
  void sendRsvpDiscordErrorNotification(event, {
    source: 'server',
    operation: 'lookup',
    endpoint: '/api/rsvp/lookup',
    method: event.node.req.method || 'GET',
    err,
    body: context.body,
    captcha: context.captcha,
  })
}

export default defineEventHandler(async (event) => {
  let body: RsvpLookupRequestBody | undefined
  let captcha: CaptchaVerifyResult | undefined

  try {
    const method = event.node.req.method || 'GET'
    if (method !== 'POST') {
      throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
    }

    if (isRsvpClosed()) {
      throw createError({ statusCode: 403, statusMessage: RSVP_CLOSED_MESSAGE })
    }

    body = (await readBody(event)) as RsvpLookupRequestBody
    const captchaToken = readStringField(body, 'captchaToken', { required: false, maxLen: 4096 }) || ''
    const fullName = readStringField(body, 'fullName', { required: true, maxLen: 160 })!
    const zipCode = readStringField(body, 'zipCode', { required: false, maxLen: 20 })

    captcha = await verifyRecaptchaToken(event, captchaToken)
    if (!captcha.ok) captchaError(captcha)

    try {
      const lookup = await findRsvpGuestLookup(event, { fullName, zipCode })

      return {
        ok: true,
        ...lookup,
        captcha: {
          bypassed: captcha.bypassed === true,
          score: captcha.score ?? null,
          action: captcha.action ?? null,
        },
      }
    } catch (err) {
      sheetsError(err)
    }
  } catch (err) {
    notifyRsvpServerError(event, err, { body, captcha })
    throw err
  }
})
