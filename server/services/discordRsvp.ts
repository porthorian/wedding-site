import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { RsvpGuest, RsvpUpdateNotification } from './googleSheets'

const DISCORD_WEBHOOK_TIMEOUT_MS = 4000
const DISCORD_FIELD_VALUE_LIMIT = 1024
const DISCORD_STACK_VALUE_LIMIT = 1800
const MAX_JSON_DEPTH = 5
const MAX_ARRAY_ITEMS = 20
const MAX_OBJECT_KEYS = 40
const MAX_STRING_LENGTH = 700
const REDACTED = '[redacted]'

type DiscordRuntimeConfig = {
  discordRsvpWebhookUrl?: string
}

type DiscordEmbedField = {
  name: string
  value: string
  inline?: boolean
}

type DiscordWebhookPayload = {
  allowed_mentions: {
    parse: string[]
  }
  embeds: Array<{
    title: string
    color: number
    timestamp: string
    description?: string
    fields: DiscordEmbedField[]
  }>
}

type ErrorInfo = {
  name: string
  message: string
  stack?: string
  statusCode?: number
  statusMessage?: string
  causeName?: string
  causeMessage?: string
}

export type RsvpDiscordErrorNotification = {
  source: 'server' | 'client'
  operation: string
  endpoint?: string
  method?: string
  err?: unknown
  errorName?: string
  errorMessage?: string
  stack?: string
  statusCode?: number | null
  statusMessage?: string | null
  body?: unknown
  request?: unknown
  captcha?: unknown
  client?: unknown
  timestampISO?: string
}

function readWebhookUrl(event: H3Event): string {
  const config = useRuntimeConfig(event) as DiscordRuntimeConfig
  const envWebhookUrl = process.env.DISCORD_RSVP_WEBHOOK_URL?.trim() || ''
  const configWebhookUrl = typeof config.discordRsvpWebhookUrl === 'string' ? config.discordRsvpWebhookUrl.trim() : ''
  return envWebhookUrl || configWebhookUrl
}

function truncateDiscordField(value: string): string {
  if (value.length <= DISCORD_FIELD_VALUE_LIMIT) return value
  return `${value.slice(0, DISCORD_FIELD_VALUE_LIMIT - 3)}...`
}

function truncateValue(value: string, limit: number): string {
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 3)}...`
}

function formatDiscordTimestamp(value: string): string {
  const timestampMs = Date.parse(value)
  if (!Number.isFinite(timestampMs)) return value || 'Unknown'
  return `<t:${Math.floor(timestampMs / 1000)}:f>`
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    normalized.includes('authorization') ||
    normalized.includes('cookie') ||
    normalized.includes('captchatoken') ||
    normalized.includes('matchtoken') ||
    normalized.includes('webhook') ||
    normalized.includes('privatekey') ||
    normalized.includes('secret') ||
    normalized.includes('password') ||
    normalized.includes('token')
  )
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return value
  if (typeof value === 'string') return truncateValue(value, MAX_STRING_LENGTH)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return sanitizeValue(readErrorInfo(value), depth + 1)
  if (depth >= MAX_JSON_DEPTH) return '[truncated]'

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1))
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[${value.length - MAX_ARRAY_ITEMS} more items]`)
    return items
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    const sanitized: Record<string, unknown> = {}

    entries.slice(0, MAX_OBJECT_KEYS).forEach(([key, item]) => {
      sanitized[key] = shouldRedactKey(key) ? REDACTED : sanitizeValue(item, depth + 1)
    })

    if (entries.length > MAX_OBJECT_KEYS) {
      sanitized.__truncated = `${entries.length - MAX_OBJECT_KEYS} more keys`
    }

    return sanitized
  }

  return String(value)
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(sanitizeValue(value), null, 2)
  } catch {
    return JSON.stringify('[unserializable]')
  }
}

function jsonField(value: unknown): string {
  const json = safeJson(value)
  return truncateDiscordField(`\`\`\`json\n${json}\n\`\`\``)
}

function textField(value: string): string {
  return truncateDiscordField(value.trim() || 'Unknown')
}

function getRemoteAddress(event: H3Event): string {
  const forwarded = event.node.req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0]?.trim() || '-'
  return event.node.req.socket?.remoteAddress || '-'
}

function buildRequestContext(event: H3Event, override?: unknown): Record<string, unknown> {
  const req = event.node.req
  const headers = req.headers
  return {
    method: req.method || 'UNK',
    url: req.url || '/',
    endpointHost: typeof headers.host === 'string' ? headers.host : undefined,
    referer: typeof headers.referer === 'string' ? headers.referer : undefined,
    origin: typeof headers.origin === 'string' ? headers.origin : undefined,
    userAgent: typeof headers['user-agent'] === 'string' ? headers['user-agent'] : undefined,
    acceptLanguage: typeof headers['accept-language'] === 'string' ? headers['accept-language'] : undefined,
    contentType: typeof headers['content-type'] === 'string' ? headers['content-type'] : undefined,
    remoteAddress: getRemoteAddress(event),
    httpVersion: req.httpVersion,
    ...(
      override && typeof override === 'object' && !Array.isArray(override)
        ? override as Record<string, unknown>
        : {}
    ),
  }
}

function readErrorCause(err: unknown): unknown {
  if (!err || typeof err !== 'object') return undefined
  return (err as { cause?: unknown }).cause
}

function readErrorInfo(err: unknown): ErrorInfo {
  const maybeError = err && typeof err === 'object' ? err as Record<string, unknown> : null
  const data = maybeError?.data && typeof maybeError.data === 'object'
    ? maybeError.data as Record<string, unknown>
    : null
  const cause = readErrorCause(err)
  const causeInfo = cause ? readErrorInfo(cause) : null

  const name = readString(maybeError?.name) || (err instanceof Error ? err.name : '') || 'Error'
  const message =
    readString(maybeError?.message) ||
    readString(data?.message) ||
    readString(err) ||
    'Unknown error'

  return {
    name,
    message,
    stack: readString(maybeError?.stack) || undefined,
    statusCode:
      readNumber(maybeError?.statusCode) ??
      readNumber(maybeError?.status) ??
      readNumber(data?.statusCode),
    statusMessage:
      readString(maybeError?.statusMessage) ||
      readString(data?.statusMessage) ||
      undefined,
    causeName: causeInfo?.name,
    causeMessage: causeInfo?.message,
  }
}

function buildErrorInfo(notification: RsvpDiscordErrorNotification): ErrorInfo {
  const fromError = readErrorInfo(notification.err)
  return {
    ...fromError,
    name: notification.errorName || fromError.name,
    message: notification.errorMessage || fromError.message,
    stack: notification.stack || fromError.stack,
    statusCode: notification.statusCode ?? fromError.statusCode,
    statusMessage: notification.statusMessage || fromError.statusMessage,
  }
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>()
  return names.filter((name) => {
    const normalized = name.trim().replace(/\s+/g, ' ')
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function getAttendeeNames(guest: RsvpGuest): string[] {
  if (guest.willAttend !== 'yes') return []
  if (guest.namedGuestsCount === 0) return uniqueNames(guest.guestNames)

  const storedNames = new Set(guest.guestNames)
  const hasSelectedNamedGuest = guest.namedGuests.some((name) => storedNames.has(name))
  if (hasSelectedNamedGuest || guest.guestsAttending < guest.namedGuestsCount) {
    return uniqueNames(guest.guestNames)
  }

  const namedGuestsAttending = guest.namedGuests.slice(0, Math.min(guest.namedGuestsCount, guest.guestsAttending))
  return uniqueNames([...namedGuestsAttending, ...guest.guestNames])
}

function buildRsvpUpdatePayload(notification: RsvpUpdateNotification): DiscordWebhookPayload {
  const guest = notification.guest
  const attendeeNames = getAttendeeNames(guest)
  const response = guest.willAttend === 'yes' ? 'Attending' : 'Declined'
  const partyCount = guest.willAttend === 'yes' ? String(guest.guestsAttending) : '0'
  const attendees = attendeeNames.length ? attendeeNames.join('\n') : 'None'

  return {
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: notification.kind === 'new' ? 'New RSVP' : 'RSVP updated',
        color: guest.willAttend === 'yes' ? 0x4f7a5a : 0x8d5d54,
        timestamp: notification.updatedAtISO,
        fields: [
          { name: 'Invitation', value: truncateDiscordField(guest.displayName || 'Guest'), inline: true },
          { name: 'Response', value: response, inline: true },
          { name: 'Party count', value: partyCount, inline: true },
          { name: 'Received', value: formatDiscordTimestamp(notification.updatedAtISO), inline: true },
          { name: 'Attendees', value: truncateDiscordField(attendees), inline: false },
        ],
      },
    ],
  }
}

function buildRsvpErrorPayload(event: H3Event, notification: RsvpDiscordErrorNotification): DiscordWebhookPayload {
  const timestamp = notification.timestampISO || new Date().toISOString()
  const errorInfo = buildErrorInfo(notification)
  const status = notification.statusCode ?? errorInfo.statusCode
  const statusMessage = notification.statusMessage || errorInfo.statusMessage
  const fields: DiscordEmbedField[] = [
    { name: 'Source', value: notification.source, inline: true },
    { name: 'Operation', value: textField(notification.operation), inline: true },
    {
      name: 'Status',
      value: textField([status, statusMessage].filter((part) => part != null && part !== '').join(' ') || 'Unknown'),
      inline: true,
    },
    {
      name: 'Error',
      value: textField([
        errorInfo.name,
        errorInfo.message,
        errorInfo.causeName || errorInfo.causeMessage
          ? `Cause: ${[errorInfo.causeName, errorInfo.causeMessage].filter(Boolean).join(': ')}`
          : '',
      ].filter(Boolean).join('\n')),
      inline: false,
    },
    {
      name: 'Request',
      value: jsonField(buildRequestContext(event, {
        endpoint: notification.endpoint,
        method: notification.method,
        ...(
          notification.request && typeof notification.request === 'object' && !Array.isArray(notification.request)
            ? notification.request as Record<string, unknown>
            : {}
        ),
      })),
      inline: false,
    },
  ]

  if (notification.body !== undefined) {
    fields.push({ name: 'Body', value: jsonField(notification.body), inline: false })
  }

  if (notification.captcha !== undefined) {
    fields.push({ name: 'Captcha', value: jsonField(notification.captcha), inline: false })
  }

  if (notification.client !== undefined) {
    fields.push({ name: 'Client context', value: jsonField(notification.client), inline: false })
  }

  if (errorInfo.stack) {
    fields.push({
      name: 'Stack',
      value: truncateDiscordField(`\`\`\`\n${truncateValue(errorInfo.stack, DISCORD_STACK_VALUE_LIMIT)}\n\`\`\``),
      inline: false,
    })
  }

  return {
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: notification.source === 'client' ? 'RSVP client error' : 'RSVP server error',
        color: notification.source === 'client' ? 0xd28b26 : 0xb42318,
        timestamp,
        fields,
      },
    ],
  }
}

export async function sendRsvpDiscordNotification(
  event: H3Event,
  notification: RsvpUpdateNotification | null
): Promise<void> {
  try {
    if (!notification) return
    await postDiscordPayload(event, buildRsvpUpdatePayload(notification))
  } catch (err) {
    console.error('[discord-rsvp] unexpected notification error:', err)
  }
}

export async function sendRsvpDiscordErrorNotification(
  event: H3Event,
  notification: RsvpDiscordErrorNotification
): Promise<void> {
  try {
    await postDiscordPayload(event, buildRsvpErrorPayload(event, notification))
  } catch (err) {
    console.error('[discord-rsvp] unexpected error notification error:', err)
  }
}

async function postDiscordPayload(
  event: H3Event,
  payload: DiscordWebhookPayload
): Promise<void> {
  const webhookUrl = readWebhookUrl(event)
  if (!webhookUrl) return

  let url: URL
  try {
    url = new URL(webhookUrl)
    url.searchParams.set('wait', 'true')
  } catch {
    console.error('[discord-rsvp] invalid Discord RSVP webhook URL')
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DISCORD_WEBHOOK_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      let detail = ''
      try {
        detail = (await response.text()).slice(0, 500)
      } catch {
        detail = ''
      }
      console.error(`[discord-rsvp] webhook returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`)
    }
  } catch (err) {
    console.error('[discord-rsvp] webhook request failed:', err)
  } finally {
    clearTimeout(timeout)
  }
}
