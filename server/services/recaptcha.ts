import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

type RecaptchaSiteVerifyResponse = {
  success?: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  ['error-codes']?: string[]
}

export type RecaptchaVerifyResult =
  | {
      ok: true
      bypassed?: boolean
      score?: number
      action?: string
      hostname?: string
      challengeTs?: string
    }
  | {
      ok: false
      reason:
        | 'missing_token'
        | 'not_configured'
        | 'http_error'
        | 'verification_failed'
        | 'low_score'
        | 'bad_action'
        | 'network_error'
      score?: number
      action?: string
      errorCodes?: string[]
    }

function getRemoteAddress(event: H3Event): string | undefined {
  const forwarded = event.node.req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0]?.trim()
  return event.node.req.socket?.remoteAddress || undefined
}

export async function verifyRecaptchaToken(event: H3Event, token: string): Promise<RecaptchaVerifyResult> {
  const config = useRuntimeConfig(event)
  const secret = typeof config.recaptchaSecret === 'string' ? config.recaptchaSecret : ''
  const bypass = config.recaptchaBypass === true

  if (bypass) return { ok: true, bypassed: true }
  if (!token?.trim()) return { ok: false, reason: 'missing_token' }
  if (!secret) return { ok: false, reason: 'not_configured' }

  const params = new URLSearchParams({ secret, response: token })
  const remoteAddress = getRemoteAddress(event)
  if (remoteAddress) params.set('remoteip', remoteAddress)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    })

    if (!response.ok) return { ok: false, reason: 'http_error' }

    const data = (await response.json()) as RecaptchaSiteVerifyResponse
    if (data?.success !== true) {
      return {
        ok: false,
        reason: 'verification_failed',
        errorCodes: Array.isArray(data?.['error-codes']) ? data['error-codes'] : undefined,
      }
    }

    const expectedAction = typeof config.recaptchaExpectedAction === 'string' ? config.recaptchaExpectedAction : ''
    if (expectedAction && typeof data.action === 'string' && data.action !== expectedAction) {
      return { ok: false, reason: 'bad_action', action: data.action }
    }

    const minimumScore =
      typeof config.recaptchaMinimumScore === 'number' && Number.isFinite(config.recaptchaMinimumScore)
        ? config.recaptchaMinimumScore
        : 0.5

    if (typeof data.score === 'number' && Number.isFinite(data.score) && data.score < minimumScore) {
      return { ok: false, reason: 'low_score', score: data.score, action: data.action }
    }

    return {
      ok: true,
      score: typeof data.score === 'number' ? data.score : undefined,
      action: typeof data.action === 'string' ? data.action : undefined,
      hostname: typeof data.hostname === 'string' ? data.hostname : undefined,
      challengeTs: typeof data.challenge_ts === 'string' ? data.challenge_ts : undefined,
    }
  } catch {
    return { ok: false, reason: 'network_error' }
  } finally {
    clearTimeout(timeout)
  }
}
