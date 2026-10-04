import { message, t } from '../../i18n/translate'
import type { JourneyService } from './serviceData'

export interface QuoteDraft {
  service: JourneyService; pickup: string; destination: string; date: string; time: string;
  airportPickup: boolean; flight: string; addReturn: boolean; returnDate: string; returnTime: string;
  duration: string; stops: string; ship: string; terminal: string; shipTime: string;
  notes: string; passengers: string; luggage: string; vehicle: string; equipment: string;
  name: string; email: string; phone: string;
}
export type QuoteErrors = Partial<Record<keyof QuoteDraft, string>>
export const initialQuote: QuoteDraft = {
  service: 'airport', pickup: '', destination: '', date: '', time: '', airportPickup: false,
  flight: '', addReturn: false, returnDate: '', returnTime: '', duration: '', stops: '',
  ship: '', terminal: '', shipTime: '', notes: '', passengers: '2', luggage: '2', vehicle: '',
  equipment: '', name: '', email: '', phone: '',
}
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function validateQuote(draft: QuoteDraft, step: number, now = new Date()): QuoteErrors {
  const errors: QuoteErrors = {}
  const required = (key: keyof QuoteDraft, label: string) => { if (!String(draft[key]).trim()) errors[key] = message("Please enter {0}.", t(label)) }
  if (step === 0) {
    required('pickup', 'your pick-up location'); required('destination', 'your destination')
    required('date', 'a travel date'); required('time', 'a pick-up time')
    const departure = new Date(`${draft.date}T${draft.time}`)
    if (draft.date && draft.time && (!Number.isFinite(departure.getTime()) || departure <= now)) errors.date = 'Choose a date and time in the future.'
    if (draft.airportPickup) required('flight', 'your flight number')
    if (draft.service === 'hourly') { required('duration', 'the approximate duration'); required('stops', 'your planned stops or schedule') }
    if (draft.service === 'cruise') { required('ship', 'your ship name'); required('terminal', 'your terminal'); required('shipTime', 'the boarding or disembarkation time') }
    if (draft.addReturn) {
      required('returnDate', 'a return date'); required('returnTime', 'a return time')
      const returning = new Date(`${draft.returnDate}T${draft.returnTime}`)
      if (draft.returnDate && draft.returnTime && (!Number.isFinite(returning.getTime()) || returning <= departure)) errors.returnDate = 'The return must be after your outward journey.'
    }
  }
  if (step === 1) {
    if (!draft.passengers || !Number.isInteger(Number(draft.passengers)) || Number(draft.passengers) < 1 || Number(draft.passengers) > 12) errors.passengers = 'Enter between 1 and 12 passengers. For larger groups, contact us.'
    if (draft.luggage === '' || !Number.isInteger(Number(draft.luggage)) || Number(draft.luggage) < 0) errors.luggage = 'Enter the number of bags (0 if none).'
  }
  if (step === 2) {
    required('name', 'your full name'); required('email', 'your email address')
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'Enter a valid email address.'
  }
  return errors
}
