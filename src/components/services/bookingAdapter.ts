import { bookingDetails, newJourney, serviceNames, type ContactDetails, type JourneyDraft, type PassengerDetails } from '../bookingModel'
import type { BookingService } from '../../config/bookingExtras'
import type { BookingPayload } from '../../lib/sendBooking'
import type { JourneyRequest } from './serviceData'

// These chapters sell transfers, including mountain/coast/Prosecco destinations.
// Keep them as transfers rather than silently converting them into day trips.
export function serviceBookingSelection(request: JourneyRequest, previous: JourneyDraft): { mode: BookingService; journey: JourneyDraft } {
  return {
    mode: request.service === 'hourly' ? 'hourly' : 'transfer',
    journey: {
      ...newJourney(), dateTime: previous.dateTime, duration: previous.duration,
      pickup: { text: request.pickup ?? '', metadata: null },
      destination: { text: request.destination ?? '', metadata: null },
      airportIncluded: Boolean(request.airportPickup), airportMode: 'pickup',
      cruiseIncluded: request.service === 'cruise', waterIncluded: request.service === 'water-taxi',
      tripType: request.addReturn ? 'round-trip' : 'one-way',
    },
  }
}

// Reuse the complete Home details while retaining the established quote email.
export function bookingRequestPayload(mode: BookingService, journey: JourneyDraft, passengers: PassengerDetails, contact: ContactDetails, quoteLabel?: string): BookingPayload {
  return {
    kind: quoteLabel ? 'custom' : mode,
    source: quoteLabel ? 'services-quote' : 'home-booking',
    service: quoteLabel ?? serviceNames[mode],
    name: contact.fullName.trim(), email: contact.email.trim(), phone: contact.phone.trim(),
    preferredContact: contact.preferredContact, consent: contact.consent,
    details: bookingDetails(mode, journey, passengers, contact, quoteLabel),
  }
}
