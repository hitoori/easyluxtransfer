import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'
const { serviceBookingSelection, bookingRequestPayload } = await import(typescriptModule(new URL('../src/components/services/bookingAdapter.ts', import.meta.url), false))
const { newJourney, newPassengers, newContact, validateInitial, validateJourney } = await import(typescriptModule(new URL('../src/components/bookingModel.ts', import.meta.url), false))
const previous = { ...newJourney(), dateTime: '2026-11-20T10:00', duration: '4 hours', waterIncluded: true, cruiseIncluded: true, flightNumber: 'OLD', stops: [{ id: 'old', location: { text: 'Old stop', metadata: null }, duration: '30 min', otherDuration: '' }] }

test('Services prefills the shared Home flow without converting transfers into day trips', () => {
  for (const service of ['airport','water-taxi','europe','prosecco','mountains','coast','cruise','custom']) {
    const next = serviceBookingSelection({ service, pickup: 'Venice', destination: 'Hotel' }, previous)
    assert.equal(next.mode, 'transfer')
    assert.equal(next.journey.pickup.text, 'Venice')
    assert.equal(next.journey.destination.text, 'Hotel')
    assert.equal(next.journey.dateTime, previous.dateTime)
    assert.equal(next.journey.cruiseIncluded, service === 'cruise')
    assert.equal(next.journey.waterIncluded, service === 'water-taxi')
    assert.deepEqual(next.journey.stops, [])
    assert.equal(next.journey.flightNumber, '')
  }
  const hourly = serviceBookingSelection({ service: 'hourly' }, previous)
  assert.equal(hourly.mode, 'hourly')
  assert.equal(hourly.journey.duration, '4 hours')
})
test('airport and return choices retain Home validation and cannot submit missing flight/return details', () => {
  const { journey } = serviceBookingSelection({ service: 'airport', pickup: 'Treviso Airport', destination: 'Venice Hotel', airportPickup: true, addReturn: true }, previous)
  const now = new Date('2026-10-06T12:00').getTime()
  assert.deepEqual(validateInitial('transfer', journey, now), {})
  const errors = validateJourney('transfer', journey, now)
  assert.ok(errors.flightNumber)
  assert.ok(errors.returnDateTime)
  const valid = { ...journey, flightUnavailable: true, returnDateTime: '2026-11-21T10:00' }
  assert.deepEqual(validateJourney('transfer', valid, now), {})
})
test('shared full passenger/extra details preserve Services quote email routing and Home booking routing', () => {
  const journey = { ...newJourney(), pickup: { text: 'Venice', metadata: null }, destination: { text: 'Jesolo', metadata: null }, dateTime: '2026-11-20T10:00' }
  const passengers = { ...newPassengers(), passengers: 2, largeLuggage: 1, cabinBags: 2, childSeatsEnabled: true, childAges: [{ value: '3', unit: 'years' }], extras: { wine: 1 }, specialRequests: 'QA request' }
  const contact = { ...newContact(), fullName: ' QA Example ', email: ' qa@example.com ', consent: true }
  const quote = bookingRequestPayload('transfer', journey, passengers, contact, 'Seaside')
  assert.equal(quote.kind, 'custom'); assert.equal(quote.source, 'services-quote'); assert.equal(quote.service, 'Seaside')
  assert.equal(quote.name, 'QA Example'); assert.equal(quote.email, 'qa@example.com')
  for (const detail of ['Jesolo', 'Large suitcases', 'Cabin bags', 'Child seats', 'Wine bottle', 'QA request']) assert.ok(quote.details.includes(detail), detail)
  const home = bookingRequestPayload('transfer', journey, passengers, contact)
  assert.equal(home.kind, 'transfer'); assert.equal(home.source, 'home-booking'); assert.equal(home.service, 'Private Transfer')
  assert.ok(quote.details.startsWith('Service: Seaside\n'))
  assert.equal(home.details.replace('Service: Private Transfer', 'Service: Seaside'), quote.details)
})
