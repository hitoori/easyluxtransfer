import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'

// Exercise the actual TypeScript rules without mounting the UI or making any
// network requests. Both local mock-up prices and production prices are covered.
async function loadModel(preview) {
  return import(typescriptModule(new URL('../src/components/bookingModel.ts', import.meta.url), preview))
}
const model = await loadModel(true)
const productionModel = await loadModel(false)
const now = new Date('2030-06-01T10:00').getTime()
const journey = () => ({ ...model.newJourney(), pickup: { text: 'Venice hotel', metadata: null }, destination: { text: 'Marco Polo Airport', metadata: null }, dateTime: '2030-06-02T10:00' })

test('future dates and return order are enforced; default return route stays reversed', () => {
  const draft = { ...journey(), tripType: 'round-trip', returnDateTime: '2030-06-02T09:00' }
  assert.match(model.validateJourney('transfer', draft, now).returnDateTime, /after departure/)
  draft.returnDateTime = '2030-06-03T09:00'
  assert.deepEqual(model.validateJourney('transfer', draft, now), {})
  const context = model.routeContext(draft)
  assert.equal(context.returnPickup.text, draft.destination.text)
  assert.equal(context.returnDestination.text, draft.pickup.text)
  assert.match(model.validateInitial('transfer', { ...draft, dateTime: '2020-01-01T10:00' }, now).dateTime, /future/)
})

test('typed airport text stays unverified; selected airport metadata and unavailable flight details work', () => {
  const draft = journey()
  assert.equal(model.routeContext(draft).airportMode, null)
  draft.pickup = { text: 'Marco Polo Airport', metadata: { placeId: 'airport', types: ['airport'] } }
  draft.destination = { text: 'Venice hotel', metadata: null }
  assert.equal(model.routeContext(draft).airportMode, 'pickup')
  assert.match(model.validateJourney('transfer', draft, now).flightNumber, /flight number/)
  draft.flightUnavailable = true
  assert.deepEqual(model.validateJourney('transfer', draft, now), {})
  const rows = model.journeyReview('transfer', draft)
  assert.equal(rows.filter(row => row.label === 'Flight arrival date & time').length, 1)
})

test('added stops must be complete, including custom duration', () => {
  const draft = { ...journey(), stops: [{ id: 'stop', location: model.blankLocation(), duration: 'Other', otherDuration: '' }] }
  const errors = model.validateJourney('transfer', draft, now)
  assert.ok(errors['stop-0'])
  assert.ok(errors['stop-other-0'])
  draft.stops[0].location.text = 'Treviso'
  draft.stops[0].otherDuration = '45 minutes'
  assert.deepEqual(model.validateJourney('transfer', draft, now), {})
})

test('stop waiting controls change duration by 15 minutes without changing the route', () => {
  const stop = { id: 'stop', location: { text: 'Treviso', metadata: null }, duration: 'Not sure yet', otherDuration: '' }
  let current = model.stepStopDuration(stop, 1)
  assert.equal(current.duration, '15 min')
  assert.equal(model.stepStopDuration(current, -1).duration, '15 min')
  current = model.stepStopDuration(current, 1)
  assert.equal(current.duration, '30 min')
  current = model.stepStopDuration(current, 1)
  assert.equal(current.duration, '45 min')
  current = model.stepStopDuration(current, 1)
  assert.equal(current.duration, '1 hour')
  current = model.stepStopDuration(current, 1)
  assert.equal(current.duration, '75 min')
  assert.deepEqual(current.location, stop.location)
  assert.deepEqual(model.validateJourney('transfer', { ...journey(), stops: [current] }, now), {})
  assert.equal(model.journeyReview('transfer', { ...journey(), stops: [current] }).find(row => row.label === 'Stop 1').value, 'Treviso · 75 min')
  assert.equal(model.stepStopDuration({ ...stop, duration: 'Other', otherDuration: '45 minutes' }, 1).duration, '1 hour')
  assert.equal(model.stepStopDuration({ ...stop, duration: '2 hours' }, -1).duration, '105 min')
})

test('a manually entered different return airport route can be marked and is ignored when disabled', () => {
  const draft = { ...journey(), tripType: 'round-trip', returnDateTime: '2030-06-03T10:00', differentReturn: true, returnAirportIncluded: true, returnAirportMode: 'pickup', returnPickup: { text: 'Treviso Airport', metadata: null }, returnDestination: { text: 'Hotel', metadata: null } }
  assert.match(model.validateJourney('transfer', draft, now).returnFlightNumber, /return flight/)
  draft.returnFlightUnavailable = true
  assert.deepEqual(model.validateJourney('transfer', draft, now), {})
  draft.differentReturn = false
  assert.equal(model.routeContext(draft).returnAirportMode, null)
})

test('hourly duration can be unknown and does not include stale transfer or tour data', () => {
  const draft = { ...journey(), tripType: 'round-trip', returnDateTime: '2030-06-03T09:00', flightNumber: 'STALE-FLIGHT', shipName: 'STALE-SHIP', itineraryHelp: true }
  const passengers = { ...model.newPassengers(), extras: { waiting: 2, wine: 1 } }
  const contact = { ...model.newContact(), fullName: 'Client', email: 'client@example.com' }
  const details = model.bookingDetails('hourly', draft, passengers, contact)
  assert.doesNotMatch(details, /STALE|Round trip|Return route|Additional waiting|Itinerary planning/)
  assert.match(details, /Wine bottle/)
  assert.match(model.estimatedEnd(draft), /13:00/)
  draft.duration = 'Not sure yet'
  assert.equal(model.estimatedEnd(draft), '')
  assert.deepEqual(model.validateJourney('hourly', draft, now), {})
})

test('day trips require the exact itinerary and validate the same-day return time', () => {
  const draft = { ...journey(), returnUnsure: false, approximateReturnTime: '09:00' }
  const errors = model.validateJourney('tours', draft, now)
  assert.ok(errors.exactDestination)
  assert.ok(errors.approximateReturnTime)
  draft.exactDestination = 'Two wineries in Valdobbiadene'
  draft.approximateReturnTime = '18:00'
  assert.deepEqual(model.validateJourney('tours', draft, now), {})
  assert.ok(model.journeyReview('tours', draft).some(row => row.value.includes('Arranged separately')))
})

test('each child has an age; months are allowed under one, and seats cannot exceed passengers', () => {
  const passengers = { ...model.newPassengers(), childSeatsEnabled: true, childAges: [{ value: '6', unit: 'months' }, { value: '3', unit: 'years' }] }
  assert.ok(model.validatePassengers(passengers).childSeats)
  passengers.passengers = 2
  assert.deepEqual(model.validatePassengers(passengers), {})
  passengers.childAges[0].value = '12'
  assert.ok(model.validatePassengers(passengers)['child-0'])
  assert.doesNotMatch(model.passengerReview(passengers).map(row => row.value).join('\n'), /weight|kg/)
})

test('WhatsApp requires an international number; Email permits no phone', () => {
  const contact = { ...model.newContact(), fullName: 'Client', email: 'client@example.com', consent: true }
  assert.deepEqual(model.validateContact(contact), {})
  contact.preferredContact = 'whatsapp'
  assert.ok(model.validateContact(contact).phone)
  contact.phone = '+1------'
  assert.ok(model.validateContact(contact).phone)
  contact.phone = '+44 7700 900123'
  assert.deepEqual(model.validateContact(contact), {})
})

test('mock-up extra subtotal excludes journey/water taxi, and production hides provisional rates', () => {
  const passengers = { ...model.newPassengers(), extras: { prosecco: 2, wine: 1 } }
  const draft = { ...journey(), waterIncluded: true, waterChoice: 'yes' }
  const rows = model.priceReview('transfer', draft, passengers)
  assert.match(rows.find(row => row.label === 'Estimated extras subtotal').value, /€140/)
  assert.match(rows.find(row => row.label.includes('Water taxi')).value, /100–140/)
  const productionRows = productionModel.priceReview('transfer', draft, passengers)
  assert.match(productionRows.find(row => row.label === 'Estimated extras subtotal').value, /To be confirmed/)
  assert.equal(productionRows.filter(row => row.label.startsWith('Price on request')).length, 2)
  assert.doesNotMatch(productionRows.map(row => row.value).join('\n'), /€50|€40/)
})
