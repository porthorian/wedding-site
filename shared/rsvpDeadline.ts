export const RSVP_DEADLINE_DISPLAY = 'July 17, 2026'
export const RSVP_CUTOFF_ISO = '2026-07-18T00:00:00-04:00'
export const RSVP_CLOSED_MESSAGE =
  'RSVPs are now closed. Please contact Rosa or Vincent if you need to update your response.'

const RSVP_CUTOFF_TIME = new Date(RSVP_CUTOFF_ISO).getTime()

export function isRsvpClosed(now = new Date()): boolean {
  return now.getTime() >= RSVP_CUTOFF_TIME
}
