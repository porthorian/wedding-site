import { defineEventHandler, readBody } from 'h3'
import { sendRsvpDiscordErrorNotification } from '../../services/discordRsvp'

type ClientErrorReport = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readReportError(report: ClientErrorReport): { name: string; message: string; stack?: string } {
  const error = isRecord(report.error) ? report.error : report
  const name = readString(error.name) || readString(report.errorName) || 'ClientError'
  const message =
    readString(report.visibleMessage) ||
    readString(error.message) ||
    readString(report.errorMessage) ||
    'Client RSVP error'
  const stack = readString(error.stack) || readString(report.stack)

  return {
    name,
    message,
    stack: stack || undefined,
  }
}

export default defineEventHandler(async (event) => {
  let body: unknown

  try {
    body = await readBody(event)
  } catch (err) {
    body = {
      operation: 'client-error-report',
      error: {
        name: err instanceof Error ? err.name : 'BodyReadError',
        message: err instanceof Error ? err.message : 'Could not read client error report body',
        stack: err instanceof Error ? err.stack : undefined,
      },
    }
  }

  const report = isRecord(body) ? body : { value: body }
  const error = readReportError(report)
  void sendRsvpDiscordErrorNotification(event, {
    source: 'client',
    operation: readString(report.operation) || 'rsvp-client',
    endpoint: readString(report.endpoint) || '/rsvp',
    method: event.node.req.method || 'POST',
    err: error,
    client: report,
    timestampISO: readString(report.timestampISO) || new Date().toISOString(),
  })

  return { ok: true }
})
