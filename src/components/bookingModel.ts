import { countLabel, getLanguage, getLocale, message, t, withRenderLanguage } from '../i18n/translate'
import type { PlaceMetadata } from './PlaceInput'
import { bookingExtras, euro, extraPrice, extraPriceLabel, type BookingService } from '../config/bookingExtras'

export type Location = { text: string; metadata: PlaceMetadata | null }
export type Stop = { id: string; location: Location; duration: string; otherDuration: string }
export type Errors = Record<string, string>
export type AirportMode = 'pickup' | 'dropoff'
export type ChildAge = { value: string; unit: 'months' | 'years' }
export interface JourneyDraft {
  pickup: Location
  destination: Location
  dateTime: string
  duration: string
  category: string
  exactDestination: string
  tripType: 'one-way' | 'round-trip'
  returnDateTime: string
  differentReturn: boolean
  returnPickup: Location
  returnDestination: Location
  airportIncluded: boolean
  airportMode: AirportMode
  flightNumber: string
  flightUnavailable: boolean
  returnFlightNumber: string
  returnFlightUnavailable: boolean
  returnAirportIncluded: boolean
  returnAirportMode: AirportMode
  cruiseIncluded: boolean
  shipName: string
  terminalDetails: string
  terminalArrival: string
  waterIncluded: boolean
  waterChoice: 'yes' | 'no' | 'unsure'
  stops: Stop[]
  plan: string
  finalDropoff: Location
  finalUndecided: boolean
  approximateReturnTime: string
  returnUnsure: boolean
  returnLocation: Location
  differentDayReturn: boolean
  arrangement: 'Driver stays with us' | 'Drop-off and return pick-up' | 'Help me choose'
  itineraryHelp: boolean
}
export interface PassengerDetails {
  passengers: number
  largeLuggage: number
  cabinBags: number
  oversized: boolean
  oversizedDetails: string
  childSeatsEnabled: boolean
  childAges: ChildAge[]
  extras: Record<string, number>
  specialRequests: string
}
export interface ContactDetails {
  fullName: string
  email: string
  phone: string
  preferredContact: 'email' | 'whatsapp'
  consent: boolean
}

export const serviceNames: Record<BookingService, string> = { transfer: 'Private Transfer', hourly: 'Chauffeur by the Hour', tours: 'Private Day Trips' }
export const durations = ['3 hours', '4 hours', '5 hours', '6 hours', '8 hours', '10 hours', '12 hours', 'Not sure yet']
export const tripCategories = ['Prosecco Hills', 'Dolomites & Mountains', 'Coast & Seaside', 'City Visits', 'Other destination']
export const stopDurations = ['15 min', '30 min', '45 min', '1 hour', '90 min', '2 hours', 'Other', 'Not sure yet']
export function stopDurationMinutes(stop: Stop): number | null {
  const value = stop.duration === 'Other' ? stop.otherDuration : stop.duration
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|h(?:ou)?rs?|hours?)$/i)
  if (!match) return null
  const minutes = Number(match[1]) * (/^h/i.test(match[2]) ? 60 : 1)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
}
export function stepStopDuration(stop: Stop, direction: -1 | 1): Stop {
  const current = stopDurationMinutes(stop) ?? 0
  const minutes = Math.max(15, (direction === 1 ? Math.floor(current / 15) + 1 : Math.ceil(current / 15) - 1) * 15)
  return { ...stop, duration: minutes % 60 === 0 ? `${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}` : `${minutes} min`, otherDuration: '' }
}
export const blankLocation = (): Location => ({ text: '', metadata: null })
export const newJourney = (): JourneyDraft => ({
  pickup: blankLocation(), destination: blankLocation(), dateTime: '', duration: '3 hours', category: 'Prosecco Hills', exactDestination: '',
  tripType: 'one-way', returnDateTime: '', differentReturn: false, returnPickup: blankLocation(), returnDestination: blankLocation(),
  airportIncluded: false, airportMode: 'pickup', flightNumber: '', flightUnavailable: false, returnFlightNumber: '', returnFlightUnavailable: false, returnAirportIncluded: false, returnAirportMode: 'pickup',
  cruiseIncluded: false, shipName: '', terminalDetails: '', terminalArrival: '', waterIncluded: false, waterChoice: 'unsure', stops: [],
  plan: '', finalDropoff: blankLocation(), finalUndecided: true, approximateReturnTime: '', returnUnsure: true,
  returnLocation: blankLocation(), differentDayReturn: false, arrangement: 'Help me choose', itineraryHelp: false,
})
export const newPassengers = (): PassengerDetails => ({ passengers: 1, largeLuggage: 0, cabinBags: 0, oversized: false, oversizedDetails: '', childSeatsEnabled: false, childAges: [{ value: '', unit: 'years' }], extras: {}, specialRequests: '' })
export const newContact = (): ContactDetails => ({ fullName: '', email: '', phone: '', preferredContact: 'email', consent: false })

export function readableDateTime(value: string) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(getLocale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
export function localDateTime(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
export function estimatedEnd(draft: JourneyDraft) {
  if (!draft.dateTime || draft.duration === 'Not sure yet') return ''
  const start = new Date(draft.dateTime).getTime()
  return Number.isFinite(start) ? readableDateTime(localDateTime(new Date(start + Number.parseInt(draft.duration) * 3600000))) : ''
}
export const isAirport = (location: Location) => location.metadata?.types.includes('airport') ?? false
export const isCruise = (location: Location) => Boolean(location.metadata && /cruise|crocier|fusina|ravenna.*port|trieste.*terminal/i.test(location.text))
export function needsWater(location: Location) {
  const meta = location.metadata
  return Boolean(meta?.latitude && meta.longitude && meta.latitude > 45.422 && meta.latitude < 45.455 && meta.longitude > 12.305 && meta.longitude < 12.373 && !/piazzale roma|tronchetto|santa lucia/i.test(location.text))
}
export function routeContext(draft: JourneyDraft) {
  const returning = draft.tripType === 'round-trip'
  const returnPickup = draft.differentReturn ? draft.returnPickup : draft.destination
  const returnDestination = draft.differentReturn ? draft.returnDestination : draft.pickup
  const airportMode = isAirport(draft.pickup) ? 'pickup' : isAirport(draft.destination) ? 'dropoff' : draft.airportIncluded || draft.stops.some(stop => isAirport(stop.location)) ? draft.airportMode : null
  const returnAirportMode = !returning ? null : isAirport(returnPickup) ? 'pickup' : isAirport(returnDestination) ? 'dropoff' : draft.differentReturn && draft.returnAirportIncluded ? draft.returnAirportMode : draft.airportIncluded && !draft.differentReturn ? (airportMode === 'pickup' ? 'dropoff' : 'pickup') : null
  const locations = [draft.pickup, draft.destination, ...draft.stops.map(stop => stop.location), ...(returning ? [returnPickup, returnDestination] : [])]
  const cruiseDetected = locations.some(isCruise)
  const waterDetected = locations.some(needsWater)
  return { airportMode, returnAirportMode, returnPickup, returnDestination, cruiseDetected, waterDetected, cruise: draft.cruiseIncluded || cruiseDetected, water: draft.waterIncluded || waterDetected }
}

function checkFuture(value: string, label: string, now: number) {
  if (!value) return message("Select {0}.", t(label))
  const time = new Date(value).getTime()
  return !Number.isFinite(time) || time <= now ? 'Choose a future date and time.' : ''
}
export function validateInitial(service: BookingService, draft: JourneyDraft, now = Date.now()): Errors {
  const errors: Errors = {}
  if (!draft.pickup.text.trim()) errors.pickup = 'Enter a pick-up location.'
  if (service === 'transfer') {
    if (!draft.destination.text.trim()) errors.destination = 'Enter a destination.'
    else if (draft.pickup.text.trim().toLowerCase() === draft.destination.text.trim().toLowerCase()) errors.destination = 'Destination must be different.'
  }
  if (service === 'hourly' && !durations.includes(draft.duration)) errors.duration = 'Choose a duration.'
  if (service === 'tours') {
    if (!tripCategories.includes(draft.category)) errors.category = 'Choose a trip destination.'
    if (draft.category === 'Other destination' && !draft.exactDestination.trim()) errors.exactDestination = 'Enter your destination.'
  }
  const dateError = checkFuture(draft.dateTime, 'a date and time', now)
  if (dateError) errors.dateTime = dateError
  return errors
}
export function validateJourney(service: BookingService, draft: JourneyDraft, now = Date.now()): Errors {
  const errors = validateInitial(service, draft, now)
  const context = routeContext(draft)
  if (service === 'transfer') {
    if (draft.tripType === 'round-trip') {
      if (!draft.returnDateTime || !Number.isFinite(new Date(draft.returnDateTime).getTime())) errors.returnDateTime = 'Select the return date and time.'
      else if (new Date(draft.returnDateTime).getTime() <= new Date(draft.dateTime).getTime()) errors.returnDateTime = 'Return must be after departure.'
      if (!context.returnPickup.text.trim()) errors.returnPickup = 'Enter the return pick-up.'
      if (!context.returnDestination.text.trim()) errors.returnDestination = 'Enter the return destination.'
      else if (context.returnPickup.text.trim().toLowerCase() === context.returnDestination.text.trim().toLowerCase()) errors.returnDestination = 'Return destination must be different.'
      if (context.returnAirportMode === 'pickup' && !draft.returnFlightUnavailable && !draft.returnFlightNumber.trim()) errors.returnFlightNumber = 'Enter the return flight number or choose details not available yet.'
    }
    if (context.airportMode === 'pickup' && !draft.flightUnavailable && !draft.flightNumber.trim()) errors.flightNumber = 'Enter the flight number or choose details not available yet.'
    if (context.cruise && !draft.shipName.trim()) errors.shipName = 'Enter the ship name.'
    if (context.cruise && draft.terminalArrival && (!Number.isFinite(new Date(draft.terminalArrival).getTime()) || new Date(draft.terminalArrival).getTime() <= new Date(draft.dateTime).getTime())) errors.terminalArrival = 'Terminal arrival must be after pick-up.'
  }
  if (service === 'hourly' && !draft.finalUndecided && !draft.finalDropoff.text.trim()) errors.finalDropoff = 'Enter a final drop-off or choose Not decided yet.'
  if (service === 'tours') {
    if (!draft.exactDestination.trim()) errors.exactDestination = 'Enter the exact destination or places to visit.'
    if (!draft.returnUnsure) {
      if (!draft.approximateReturnTime) errors.approximateReturnTime = 'Choose a return time or select Not sure yet.'
      else if (new Date(`${draft.dateTime.slice(0, 10)}T${draft.approximateReturnTime}`).getTime() <= new Date(draft.dateTime).getTime()) errors.approximateReturnTime = 'Return must be after the start time on the same day.'
    }
    if (draft.differentDayReturn && !draft.returnLocation.text.trim()) errors.returnLocation = 'Enter the return location.'
  }
  if (service !== 'tours') draft.stops.forEach((stop, index) => {
    if (!stop.location.text.trim()) errors[`stop-${index}`] = 'Enter the stop location or remove it.'
    const minutes = stopDurationMinutes(stop)
    if (!stopDurations.includes(stop.duration) && !(stop.duration !== 'Other' && minutes !== null && Number.isInteger(minutes) && minutes % 15 === 0)) errors[`stop-duration-${index}`] = 'Choose an estimated duration.'
    if (stop.duration === 'Other' && !stop.otherDuration.trim()) errors[`stop-other-${index}`] = 'Enter the estimated duration.'
  })
  return errors
}
export function validatePassengers(details: PassengerDetails): Errors {
  const errors: Errors = {}
  if (details.oversized && !details.oversizedDetails.trim()) errors.oversizedDetails = 'Describe the oversized items.'
  if (details.childSeatsEnabled) {
    if (details.childAges.length > details.passengers) errors.childSeats = 'Child seats cannot exceed the passenger count.'
    details.childAges.forEach((age, index) => {
      const value = Number(age.value)
      if (age.value === '' || !Number.isInteger(value) || (age.unit === 'months' ? value < 0 || value > 11 : value < 1 || value > 17)) errors[`child-${index}`] = age.unit === 'months' ? 'Enter 0–11 months for a child under one.' : 'Enter 1–17 years, or use months for a child under one.'
    })
  }
  return errors
}
export const validInternationalPhone = (value: string) => /^\+[1-9][\d\s().-]+$/.test(value.trim()) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15
export function validateContact(details: ContactDetails): Errors {
  const errors: Errors = {}
  if (details.fullName.trim().length < 2) errors.fullName = 'Enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) errors.email = 'Enter a valid email address.'
  if ((details.preferredContact === 'whatsapp' || details.phone.trim()) && !validInternationalPhone(details.phone)) errors.phone = 'Enter a phone number with international prefix, for example +44.'
  if (!details.consent) errors.consent = 'Agree to be contacted about this request.'
  return errors
}

export type ReviewEntry = { label: string; value: string }
export function journeyReview(service: BookingService, draft: JourneyDraft, serviceLabel = serviceNames[service]): ReviewEntry[] {
  const rows: ReviewEntry[] = [{ label: 'Service', value: serviceLabel }, { label: 'Pick-up', value: draft.pickup.text }]
  const add = (label: string, value: string) => { if (value) rows.push({ label, value }) }
  if (service === 'transfer') {
    const context = routeContext(draft)
    add('Destination', draft.destination.text)
    add(context.airportMode === 'pickup' ? 'Flight arrival date & time' : 'Pick-up date & time', readableDateTime(draft.dateTime))
    add('Trip type', draft.tripType === 'round-trip' ? 'Round trip' : 'One way')
    if (context.airportMode) { add('Airport service', context.airportMode === 'pickup' ? 'Airport pick-up' : 'Airport drop-off'); add('Flight', draft.flightUnavailable && context.airportMode === 'pickup' ? 'Details not available yet' : draft.flightNumber) }
    if (draft.tripType === 'round-trip') {
      add('Return route', `${context.returnPickup.text} → ${context.returnDestination.text}`)
      add(context.returnAirportMode === 'pickup' ? 'Return flight arrival date & time' : 'Return pick-up date & time', readableDateTime(draft.returnDateTime))
      if (context.returnAirportMode) add('Return flight', draft.returnFlightUnavailable && context.returnAirportMode === 'pickup' ? 'Details not available yet' : draft.returnFlightNumber)
    }
    if (context.cruise) { add('Ship', draft.shipName); add('Terminal / boarding details', draft.terminalDetails); add('Desired terminal arrival', draft.terminalArrival ? readableDateTime(draft.terminalArrival) : '') }
    if (context.water) add('Water taxi connection', { yes: 'Yes — arrange it for me', no: 'No — I’ll arrange it myself', unsure: 'I’m not sure' }[draft.waterChoice])
  } else {
    add('Start date & time', readableDateTime(draft.dateTime))
    if (service === 'hourly') { add('Duration', draft.duration); add('Estimated finish', estimatedEnd(draft)); add('Rough plan', draft.plan); add('Final drop-off', draft.finalUndecided ? 'Not decided yet' : draft.finalDropoff.text) }
    else { add('Trip category', draft.category); add('Places to visit', draft.exactDestination); add('Approximate return time', draft.returnUnsure ? 'Not sure yet' : draft.approximateReturnTime); add('Return location', draft.differentDayReturn ? draft.returnLocation.text : draft.pickup.text); add('Journey arrangement', draft.arrangement); add('Itinerary planning help', draft.itineraryHelp ? 'Requested' : ''); if (draft.category === 'Prosecco Hills') add('Winery visits / tastings', 'Arranged separately unless included in the quote') }
  }
  if (service !== 'tours') draft.stops.forEach((stop, index) => add(message("Stop {0}", t(index + 1)), `${stop.location.text} · ${stop.duration === 'Other' ? stop.otherDuration : t(stop.duration)}`))
  return rows
}
export function passengerReview(details: PassengerDetails): ReviewEntry[] {
  const rows = [
    { label: 'Passengers', value: String(details.passengers) }, { label: 'Large suitcases', value: String(details.largeLuggage) }, { label: 'Cabin bags', value: String(details.cabinBags) },
  ]
  if (details.oversized) rows.push({ label: 'Oversized luggage', value: details.oversizedDetails })
  if (details.childSeatsEnabled) rows.push({ label: 'Child seats', value: details.childAges.map((age, index) => message('Child {0}: {1}', index + 1, getLanguage() === 'ru' ? countLabel(age.value, age.unit) : `${age.value} ${age.unit}`)).join('; ') })
  if (details.specialRequests) rows.push({ label: 'Special requests', value: details.specialRequests })
  return rows
}
export function selectedExtras(service: BookingService, details: PassengerDetails) {
  return bookingExtras.filter(extra => extra.enabled && extra.services.includes(service) && details.extras[extra.id] > 0).map(extra => ({ extra, quantity: details.extras[extra.id], price: extraPrice(extra) }))
}
export function priceReview(service: BookingService, draft: JourneyDraft, passengers: PassengerDetails): ReviewEntry[] {
  const extras = selectedExtras(service, passengers)
  const rows: ReviewEntry[] = [{ label: 'Journey price', value: 'To be confirmed' }]
  extras.filter(item => item.price !== null).forEach(({ extra, quantity, price }) => rows.push({ label: `${t(extra.name)} × ${quantity}`, value: `${extraPriceLabel(extra)} · ${extra.estimated ? t('Est. ') : ''}${euro(price! * quantity)}` }))
  if (extras.length) rows.push({ label: 'Estimated extras subtotal', value: extras.every(item => item.price === null) ? 'To be confirmed' : message("{0} · excludes journey, water taxi and unpriced extras", t(euro(extras.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)))) })
  extras.filter(item => item.price === null).forEach(({ extra, quantity }) => rows.push({ label: message("Price on request · {0} × {1}", t(extra.name), t(quantity)), value: 'Quoted separately; excluded from numeric subtotal' }))
  if (passengers.childSeatsEnabled) rows.push({ label: 'Child seat charges', value: 'To be confirmed with your quote' })
  if (service === 'transfer' && routeContext(draft).water) rows.push({ label: 'Water taxi (separate from road transfer)', value: draft.waterChoice === 'no' ? 'Arranged by you; not included' : '€100–140 estimated; final quote confirms charges' })
  return rows
}
export function bookingDetails(service: BookingService, draft: JourneyDraft, passengers: PassengerDetails, contact: ContactDetails, serviceLabel?: string) {
  return withRenderLanguage('en', () => [...journeyReview(service, draft, serviceLabel), ...passengerReview(passengers), ...priceReview(service, draft, passengers), { label: 'Preferred contact', value: contact.preferredContact === 'whatsapp' ? 'WhatsApp' : 'Email' }].map(row => `${row.label}: ${row.value}`).join('\n'))
}
