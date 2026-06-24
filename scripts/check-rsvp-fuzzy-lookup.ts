import assert from 'node:assert/strict'
import {
  findExactRsvpMatches,
  findRsvpMatchByKey,
  resolveRsvpLookupMatches,
  type RsvpLookupInput,
  type RsvpLookupResolution,
  type RsvpMatchableRow,
} from '../server/services/rsvpMatching.ts'

type FixtureGuest = {
  id: string
  firstName: string
  lastName: string
  zipCode: string
}

const fixtureGuests: FixtureGuest[] = [
  { id: 'alice-smith', firstName: 'Alice', lastName: 'Smith', zipCode: '11111' },
  { id: 'bob-smith', firstName: 'Bob', lastName: 'Smith', zipCode: '22222' },
  { id: 'carla-sullivan', firstName: 'Carla', lastName: 'Sullivan', zipCode: '33333' },
  { id: 'rosa-vincent-marone', firstName: 'Rosa & Vincent', lastName: 'Marone', zipCode: '44444' },
  { id: 'jon-johnson', firstName: 'Jon', lastName: 'Johnson', zipCode: '55555' },
  { id: 'antimo-dispirito', firstName: 'Antimo', lastName: 'Dispirito', zipCode: '66666' },
  { id: 'alex-lee-home', firstName: 'Alex', lastName: 'Lee', zipCode: '77777' },
  { id: 'alex-lee-work', firstName: 'Alex', lastName: 'Lee', zipCode: '88888' },
  { id: 'michael-alexander', firstName: 'Michael', lastName: 'Alexander', zipCode: '99999' },
  { id: 'taylor-adams', firstName: 'Taylor', lastName: 'Adams', zipCode: '10101' },
  { id: 'taylor-baker', firstName: 'Taylor', lastName: 'Baker', zipCode: '20202' },
  { id: 'taylor-clark', firstName: 'Taylor', lastName: 'Clark', zipCode: '30303' },
  { id: 'taylor-davis', firstName: 'Taylor', lastName: 'Davis', zipCode: '40404' },
  { id: 'taylor-evans', firstName: 'Taylor', lastName: 'Evans', zipCode: '50505' },
  { id: 'taylor-foster', firstName: 'Taylor', lastName: 'Foster', zipCode: '60606' },
]

const rows: RsvpMatchableRow<FixtureGuest>[] = fixtureGuests.map((guest) => ({
  value: guest,
  firstName: guest.firstName,
  lastName: guest.lastName,
  zipCode: guest.zipCode,
}))

function resolve(input: RsvpLookupInput): RsvpLookupResolution<FixtureGuest> {
  return resolveRsvpLookupMatches(rows, input)
}

function expectMatched(input: RsvpLookupInput): Extract<RsvpLookupResolution<FixtureGuest>, { status: 'matched' }> {
  const result = resolve(input)
  assert.equal(result.status, 'matched')
  if (result.status !== 'matched') throw new Error(`Expected ${input.fullName} to match`)
  return result
}

{
  const result = expectMatched({ fullName: 'Alice Smith' })
  assert.equal(result.strategy, 'exact')
  assert.equal(result.requiresConfirmation, false)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['alice-smith'])
}

{
  const result = expectMatched({ fullName: 'Sullivan' })
  assert.equal(result.strategy, 'fuzzy')
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['carla-sullivan'])
}

{
  const result = expectMatched({ fullName: 'Smith' })
  assert.equal(result.strategy, 'fuzzy')
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['alice-smith', 'bob-smith'])
}

{
  const result = expectMatched({ fullName: 'Smith', zipCode: '11111' })
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['alice-smith'])
}

{
  const result = resolve({ fullName: 'Alex Lee' })
  assert.equal(result.status, 'duplicate')
  assert.equal('matches' in result, false)
}

{
  const result = expectMatched({ fullName: 'Rosa Maron' })
  assert.equal(result.strategy, 'fuzzy')
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['rosa-vincent-marone'])
}

{
  const result = expectMatched({ fullName: 'Mr. & Mrs. Antimo Dispirito' })
  const exactMatches = findExactRsvpMatches(rows, { fullName: 'Mr. & Mrs. Antimo Dispirito' })

  assert.equal(result.strategy, 'fuzzy')
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['antimo-dispirito'])
  assert.equal(exactMatches.length, 0)
}

{
  const result = expectMatched({ fullName: 'Antmo' })
  assert.equal(result.strategy, 'fuzzy')
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['antimo-dispirito'])
}

{
  const result = expectMatched({ fullName: 'Micheel Alexznder' })
  assert.equal(result.strategy, 'fuzzy')
  assert.equal(result.requiresConfirmation, true)
  assert.deepEqual(result.matches.map((guest) => guest.id), ['michael-alexander'])
}

{
  const result = resolve({ fullName: 'Taylor' })
  assert.equal(result.status, 'duplicate')
  assert.equal('matches' in result, false)
}

{
  const result = resolve({ fullName: 'Sm' })
  assert.equal(result.status, 'not-found')
  assert.equal('matches' in result, false)
}

{
  const result = resolve({ fullName: 'Mr. & Mrs.' })
  assert.equal(result.status, 'not-found')
  assert.equal('matches' in result, false)
}

{
  const lastNameLookup = expectMatched({ fullName: 'Sullivan' })
  const selectedGuest = lastNameLookup.matches[0]
  const exactLastNameMatches = findExactRsvpMatches(rows, { fullName: 'Sullivan' })
  const tokenResolvedGuest = findRsvpMatchByKey(rows, selectedGuest.id, (guest) => guest.id)

  assert.equal(exactLastNameMatches.length, 0)
  assert.equal(tokenResolvedGuest?.id, 'carla-sullivan')
}

console.log('RSVP fuzzy lookup fixture checks passed.')
