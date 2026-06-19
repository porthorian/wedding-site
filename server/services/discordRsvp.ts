import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { RsvpGuest, RsvpUpdateNotification } from './googleSheets'

const DISCORD_WEBHOOK_TIMEOUT_MS = 4000
const DISCORD_FIELD_VALUE_LIMIT = 1024

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
    fields: DiscordEmbedField[]
  }>
}

function readWebhookUrl(event: H3Event): string {
  const config = useRuntimeConfig(event) as DiscordRuntimeConfig
  return typeof config.discordRsvpWebhookUrl === 'string' ? config.discordRsvpWebhookUrl.trim() : ''
}

function truncateDiscordField(value: string): string {
  if (value.length <= DISCORD_FIELD_VALUE_LIMIT) return value
  return `${value.slice(0, DISCORD_FIELD_VALUE_LIMIT - 3)}...`
}

function formatDiscordTimestamp(value: string): string {
  const timestampMs = Date.parse(value)
  if (!Number.isFinite(timestampMs)) return value || 'Unknown'
  return `<t:${Math.floor(timestampMs / 1000)}:f>`
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

function buildPayload(notification: RsvpUpdateNotification): DiscordWebhookPayload {
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

export async function sendRsvpDiscordNotification(
  event: H3Event,
  notification: RsvpUpdateNotification | null
): Promise<void> {
  try {
    await postRsvpDiscordNotification(event, notification)
  } catch (err) {
    console.error('[discord-rsvp] unexpected notification error:', err)
  }
}

async function postRsvpDiscordNotification(
  event: H3Event,
  notification: RsvpUpdateNotification | null
): Promise<void> {
  if (!notification) return

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
      body: JSON.stringify(buildPayload(notification)),
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
