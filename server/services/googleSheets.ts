import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

export type RsvpSubmission = {
  name: string
  email?: string
  willAttend: 'yes' | 'no'
  address?: string
  numberOfGuests: number
  dietaryRestrictions?: string
  songRequest?: string
  message?: string
  submittedAtISO: string
}

export type AppendRsvpRowResult = {
  mocked: true
  spreadsheetId?: string
  worksheetName?: string
}

export async function appendRsvpRow(event: H3Event, submission: RsvpSubmission): Promise<AppendRsvpRowResult> {
  const config = useRuntimeConfig(event)
  const sheetsConfig = config.googleSheets as { spreadsheetId?: string; worksheetName?: string } | undefined

  const spreadsheetId = typeof sheetsConfig?.spreadsheetId === 'string' ? sheetsConfig.spreadsheetId.trim() : ''
  const worksheetName = typeof sheetsConfig?.worksheetName === 'string' ? sheetsConfig.worksheetName.trim() : ''

  if (!spreadsheetId) {
    console.log('RSVP submission received (Google Sheets not configured):', submission)
    return { mocked: true }
  }

  // Mock only for now; this is where we'll integrate Google Sheets API append-row.
  console.log('Mock RSVP stored (Google Sheets pending):', {
    spreadsheetId,
    worksheetName: worksheetName || 'RSVPs',
    name: submission.name,
    willAttend: submission.willAttend,
    numberOfGuests: submission.numberOfGuests,
    submittedAtISO: submission.submittedAtISO,
  })

  return {
    mocked: true,
    spreadsheetId,
    worksheetName: worksheetName || undefined,
  }
}
