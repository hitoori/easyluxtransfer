import { createPortal } from 'react-dom'
import { pagePath } from '../types/navigation'
import { countLabel, message, t, useLocale } from '../i18n/locale'
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import PlaceInput, { type PlaceMetadata } from './PlaceInput'
import BookingDateTime from './BookingDateTime'
import { sendBooking } from '../lib/sendBooking'
import type { CountryCode } from '../lib/phoneNumber'
import { AirplaneTilt, Anchor, ArrowDown, ArrowLeft, ArrowRight, Baby, Bag, Boat, CarProfile, Check, CheckCircle, Clock, Compass, Cookie, Hourglass, MapPin, Minus, Plus, SuitcaseRolling, Trash, UsersThree, Wine, X } from '@phosphor-icons/react'
import { bookingExtras, extraPriceLabel, type BookingService } from '../config/bookingExtras'
import { blankLocation, durations, estimatedEnd, journeyReview, localDateTime, newContact, newJourney, newPassengers, passengerReview, priceReview, readableDateTime, routeContext, selectedExtras, serviceNames, stepStopDuration, stopDurationMinutes, stopDurations, tripCategories, validateContact, validateInitial, validateJourney, validatePassengers, type AirportMode, type ContactDetails, type Errors, type JourneyDraft, type Location, type PassengerDetails, type ReviewEntry } from './bookingModel'
import './booking-request.css'
import { serviceOptions, type JourneyService, type QuoteSelection } from './services/serviceData'
import ServiceSelect from './services/ServiceSelect'
import BookingSelect from './BookingSelect'
import { bookingRequestPayload, serviceBookingSelection } from './services/bookingAdapter'

const BookingPhoneInput = lazy(() => import('./BookingPhoneInput'))

export interface BookingPrefill { requestId: number; pickup: string; destination: string; airportMode?: 'none' | AirportMode }
interface BookingFormProps { prefill?: BookingPrefill | null; variant?: 'home' | 'services'; quoteSelection?: QuoteSelection | null; mobileHero?: boolean }
const tabs = [
  { id: 'transfer' as const, label: serviceNames.transfer, mobileLabel: 'Transfer', icon: CarProfile, width: 'sm:w-[220px] lg:w-[250px]' },
  { id: 'hourly' as const, label: serviceNames.hourly, mobileLabel: 'By the Hour', icon: Clock, width: 'sm:w-[245px] lg:w-[275px]' },
  { id: 'tours' as const, label: serviceNames.tours, mobileLabel: 'Day Trips', icon: Compass, width: 'sm:w-[220px] lg:w-[250px]' },
]
const stepNames = ['Your journey', 'Passengers & extras', 'Contact & review']
const tripOptions = tripCategories.map(category => [category, category] as const)
const durationOptions = durations.map(duration => [duration, duration] as const)
const controlClass = 'w-full border-0 bg-transparent p-0 text-[14px] text-cream placeholder:text-[rgba(170,163,154,0.72)] focus:outline-none sm:text-[15px]'
const extraIcons = { refreshments: Cookie, waiting: Hourglass }

interface FieldShellProps {
  children: React.ReactNode
  icon: React.ReactNode
  label: string
  error?: string
}

function FieldShell({ children, icon, label, error }: FieldShellProps) {
  useLocale()
  return (
    <div
      className={`booking-field group flex min-h-[58px] min-w-0 items-center gap-3 rounded-lg border bg-[rgba(13,14,15,0.62)] px-3.5 py-2 transition-colors sm:min-h-[68px] sm:px-4 sm:py-2.5 lg:min-h-[72px] ${
        error
          ? 'border-[var(--error)]'
          : 'border-[rgba(36,41,44,0.96)] hover:border-[rgba(143,136,128,0.48)] focus-within:border-gold'
      }`}
    >
      <span className="shrink-0 text-[rgba(200,192,181,0.68)] transition-colors group-focus-within:text-gold-light">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.13em] text-[rgba(200,192,181,0.78)]">
          {t(label)}
        </span>
        {children}
        {error ? (
          <span className="mt-1 block text-[12px] text-[var(--error)]" role="alert">
            {t(error)}
          </span>
        ) : null}
      </span>
    </div>
  )
}

interface CounterProps {
  label: string
  hint: string
  value: number
  icon: React.ReactNode
  min?: number
  max?: number
  onChange: (value: number) => void
}

function Counter({ label, hint, value, icon, min = 0, max = 12, onChange }: CounterProps) {
  useLocale()
  return <div className="br-counter">
    <div className="br-counter-title"><span aria-hidden="true">{icon}</span><span>{t(label)}</span></div>
    <div className="br-counter-bottom"><span>{t(hint)}</span><div className="br-counter-actions" aria-label={t(label)}>
      <button type="button" aria-label={message("Decrease {0}", t(t(label).toLowerCase()))} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}><Minus size={12} weight="bold" aria-hidden="true" /></button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={message("Increase {0}", t(t(label).toLowerCase()))} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}><Plus size={12} weight="bold" aria-hidden="true" /></button>
    </div></div>
  </div>
}

interface ReviewRowProps {
  label: string
  value: string
  translateValue?: boolean
}

function ReviewRow({ label, value, translateValue = true }: ReviewRowProps) {
  useLocale()
  return (
    <div className="br-review-row">
      <dt className="br-review-label">{t(label)}</dt>
      <dd className="br-review-value">
        {translateValue ? t(value) : value}
      </dd>
    </div>
  )
}


function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  useLocale()
  return <div className="br-field">
    <label htmlFor={id}>{t(label)}</label>
    {children}
    {hint && <p id={`${id}-hint`} className="br-hint">{t(hint)}</p>}
    {error && <p id={`${id}-error`} className="br-error" role="alert">{t(error)}</p>}
  </div>
}
function Choice({ name, label, value, options, onChange, children }: { name: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; children?: ReactNode }) {
  useLocale()
  return <fieldset className="br-choice" data-choice={name}><legend>{t(label)}</legend><div>{options.map(option => <label key={option.value}>
    <input className="br-option-input" type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
    <span>{t(option.label)}</span>
    <Check className="br-choice-mark" size={13} weight="bold" aria-hidden="true" />
  </label>)}{children}</div></fieldset>
}
function Toggle({ label, visualLabel, icon, checked, onChange }: { label: string; visualLabel?: string; icon?: ReactNode; checked: boolean; onChange: (value: boolean) => void }) {
  useLocale()
  return <label className="br-toggle"><input className="br-option-input" type="checkbox" aria-label={t(label)} checked={checked} onChange={event => onChange(event.target.checked)} /><span className="br-toggle-icon" aria-hidden="true">{icon ?? (checked ? <Check size={15} weight="bold" /> : <Plus size={15} />)}</span><span>{t(visualLabel ?? label)}</span>{icon && checked && <Check size={12} weight="bold" aria-hidden="true" />}</label>
}
function ReviewGroup({ title, entries, onEdit }: { title: string; entries: ReviewEntry[]; onEdit?: () => void }) {
  useLocale()
  return <section className="br-review-group"><div className="br-group-heading"><h3>{t(title)}</h3>{onEdit && <button type="button" className="br-text-button" onClick={onEdit}>{t("Edit")}<span className="sr-only"> {t(t(title).toLowerCase())}</span></button>}</div><dl>{entries.map((entry, index) => <ReviewRow key={`${entry.label}-${index}`} label={entry.label} value={entry.value} translateValue={!['Pick-up', 'Destination', 'Return route', 'Ship', 'Terminal / boarding details', 'Rough plan', 'Places to visit', 'Return location', 'Oversized luggage', 'Special requests'].includes(entry.label)} />)}</dl></section>
}
function focusError(scope: HTMLElement | null) {
  window.requestAnimationFrame(() => scope?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
}

export default function BookingForm({ prefill, variant = 'home', quoteSelection, mobileHero = false }: BookingFormProps) {
  useLocale()
  const servicesVariant = variant === 'services'
  const [quoteService, setQuoteService] = useState<JourneyService>('airport')
  const [activeTab, setActiveTab] = useState<BookingService>('transfer')
  const [drafts, setDrafts] = useState<Record<BookingService, JourneyDraft>>(() => ({ transfer: newJourney(), hourly: newJourney(), tours: newJourney() }))
  const [passengers, setPassengers] = useState<PassengerDetails>(newPassengers)
  const [contact, setContact] = useState<ContactDetails>(newContact)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('IT')
  const [phoneNational, setPhoneNational] = useState('')
  const [childSeatCount, setChildSeatCount] = useState('1')
  const [initialErrors, setInitialErrors] = useState<Errors>({})
  const [journeyErrors, setJourneyErrors] = useState<Errors>({})
  const [passengerErrors, setPassengerErrors] = useState<Errors>({})
  const [contactErrors, setContactErrors] = useState<Errors>({})
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInitial, setEditingInitial] = useState(false)
  const [showAllDetails, setShowAllDetails] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [submitted, setSubmitted] = useState<Partial<Record<BookingService, string>>>({})
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const dialogScrollRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const sendingRef = useRef(false)
  const previousBodyOverflow = useRef('')
  const bodyLocked = useRef(false)
  const requestIds = useRef<Partial<Record<BookingService, { fingerprint: string; id: string }>>>({})
  const draft = drafts[activeTab]
  const context = routeContext(draft)
  const minDate = localDateTime()
  const requestCode = submitted[activeTab]
  const quoteLabel = serviceOptions.find(([id]) => id === quoteService)?.[1] ?? 'Custom destination'

  useEffect(() => {
    if (!prefill) return
    setActiveTab('transfer')
    setDrafts(current => ({ ...current, transfer: { ...current.transfer, pickup: { text: prefill.pickup, metadata: null }, destination: { text: prefill.destination, metadata: null }, tripType: 'one-way', returnDateTime: '', differentReturn: false, returnAirportIncluded: false, cruiseIncluded: false, waterIncluded: false, stops: [], airportIncluded: Boolean(prefill.airportMode && prefill.airportMode !== 'none'), airportMode: prefill.airportMode && prefill.airportMode !== 'none' ? prefill.airportMode : 'pickup' } }))
    setSubmitted(current => ({ ...current, transfer: undefined }))
    setInitialErrors({})
    setJourneyErrors({})
    setStep(1)
    setDialogOpen(false)
    setEditingInitial(false)
  }, [prefill])

  useEffect(() => {
    if (!servicesVariant || !quoteSelection || sendingRef.current) return
    const next = serviceBookingSelection(quoteSelection, drafts[activeTab])
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setQuoteService(quoteSelection.service)
    setActiveTab(next.mode)
    setDrafts(current => ({ ...current, [next.mode]: next.journey }))
    setSubmitted(current => ({ ...current, [next.mode]: undefined }))
    setContact(current => ({ ...current, consent: false }))
    delete requestIds.current[next.mode]
    setInitialErrors({}); setJourneyErrors({}); setSendError(''); setShowAllDetails(false)
    setStep(1)
    setEditingInitial(Boolean(Object.keys(validateInitial(next.mode, next.journey)).length))
    setDialogOpen(true)
  }, [quoteSelection])

  const selectQuoteService = (service: JourneyService) => {
    if (sendingRef.current) return
    const next = serviceBookingSelection({ service, pickup: draft.pickup.text, destination: draft.destination.text }, draft)
    // An explicit airport connection remains optional until chosen or inferred.
    setQuoteService(service)
    setActiveTab(next.mode)
    setDrafts(current => ({ ...current, [next.mode]: next.journey }))
    setSubmitted(current => ({ ...current, [next.mode]: undefined }))
    delete requestIds.current[next.mode]
    setInitialErrors({}); setJourneyErrors({}); setSendError(''); setEditingInitial(false); setStep(1)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (dialogOpen && !dialog.open) {
      previousBodyOverflow.current = document.body.style.overflow
      dialog.showModal()
      document.body.style.overflow = 'hidden'
      bodyLocked.current = true
    } else if (!dialogOpen && bodyLocked.current) {
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousBodyOverflow.current
      bodyLocked.current = false
      openerRef.current?.focus()
    }
  }, [dialogOpen])
  useEffect(() => () => {
    if (bodyLocked.current) document.body.style.overflow = previousBodyOverflow.current
  }, [])
  useEffect(() => {
    if (!dialogOpen) return
    dialogScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    headingRef.current?.focus()
  }, [dialogOpen, step, requestCode])

  const updateJourney = <K extends keyof JourneyDraft>(field: K, value: JourneyDraft[K]) => {
    setDrafts(current => ({ ...current, [activeTab]: { ...current[activeTab], [field]: value } }))
    setInitialErrors(current => ({ ...current, [field]: '' }))
    setJourneyErrors(current => ({ ...current, [field]: '' }))
    setSubmitted(current => ({ ...current, [activeTab]: undefined }))
    setSendError('')
  }
  const updateLocation = (field: 'pickup' | 'destination' | 'returnPickup' | 'returnDestination' | 'finalDropoff' | 'returnLocation', text?: string, metadata?: PlaceMetadata | null) => {
    setDrafts(current => ({ ...current, [activeTab]: { ...current[activeTab], [field]: { text: text ?? current[activeTab][field].text, metadata: metadata === undefined ? null : metadata } } }))
    setInitialErrors(current => ({ ...current, [field]: '' }))
    setJourneyErrors(current => ({ ...current, [field]: '' }))
    setSubmitted(current => ({ ...current, [activeTab]: undefined }))
  }
  const updatePassengers = <K extends keyof PassengerDetails>(field: K, value: PassengerDetails[K]) => {
    setPassengers(current => ({ ...current, [field]: value }))
    setPassengerErrors({})
    setSendError('')
  }
  const updateContact = <K extends keyof ContactDetails>(field: K, value: ContactDetails[K]) => {
    setContact(current => ({ ...current, [field]: value }))
    setContactErrors(current => ({ ...current, [field]: '' }))
    setSendError('')
  }
  const selectTab = (tab: BookingService) => {
    if (sendingRef.current) return
    setActiveTab(tab)
    setEditingInitial(false)
    setInitialErrors({})
    setJourneyErrors({})
    setSendError('')
    setStep(1)
  }
  const openRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sendingRef.current) return
    const errors = validateInitial(activeTab, draft)
    setInitialErrors(errors)
    if (Object.keys(errors).length) { focusError(dockRef.current); return }
    openerRef.current = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null ?? document.activeElement as HTMLElement
    setStep(1)
    if (servicesVariant) setEditingInitial(false)
    setDialogOpen(true)
  }
  const closeDialog = () => { if (!sendingRef.current) setDialogOpen(false) }
  const goToPassengers = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validateJourney(activeTab, draft)
    setJourneyErrors(errors)
    if (Object.keys(errors).length) {
      if (Object.keys(validateInitial(activeTab, draft)).length) setEditingInitial(true)
      focusError(dialogRef.current)
      return
    }
    setStep(2)
  }
  const passengerStepErrors = () => {
    const errors = validatePassengers(passengers)
    if (passengers.childSeatsEnabled && (!childSeatCount.trim() || !Number.isInteger(Number(childSeatCount)) || Number(childSeatCount) < 1 || Number(childSeatCount) > passengers.passengers || Number(childSeatCount) !== passengers.childAges.length)) errors.childSeats = message("Enter between 1 and {0} child seats.", t(passengers.passengers))
    return errors
  }
  const goToReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = passengerStepErrors()
    setPassengerErrors(errors)
    if (Object.keys(errors).length) { focusError(dialogRef.current); return }
    setStep(3)
  }
  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sendingRef.current) return
    const journeyValidation = validateJourney(activeTab, draft)
    if (Object.keys(journeyValidation).length) { setJourneyErrors(journeyValidation); setEditingInitial(true); setStep(1); focusError(dialogRef.current); return }
    const passengerValidation = passengerStepErrors()
    if (Object.keys(passengerValidation).length) { setPassengerErrors(passengerValidation); setStep(2); focusError(dialogRef.current); return }
    const errors = validateContact(contact)
    setContactErrors(errors)
    if (Object.keys(errors).length) { focusError(dialogRef.current); return }
    const payload = bookingRequestPayload(activeTab, draft, passengers, contact, servicesVariant ? quoteLabel : undefined)
    const fingerprint = JSON.stringify(payload)
    if (requestIds.current[activeTab]?.fingerprint !== fingerprint) requestIds.current[activeTab] = { fingerprint, id: crypto.randomUUID() }
    sendingRef.current = true
    setSending(true)
    setSendError('')
    try {
      const code = await sendBooking(payload, requestIds.current[activeTab]!.id)
      setSubmitted(current => ({ ...current, [activeTab]: code }))
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'The request could not be sent. Please try again.')
    } finally { sendingRef.current = false; setSending(false) }
  }
  const startNew = () => {
    setDrafts(current => ({ ...current, [activeTab]: servicesVariant ? serviceBookingSelection({ service: quoteService }, newJourney()).journey : newJourney() }))
    setPassengers(newPassengers())
    setChildSeatCount('1')
    setShowAllDetails(false)
    setContact(newContact())
    setPhoneCountry('IT')
    setPhoneNational('')
    setSubmitted(current => ({ ...current, [activeTab]: undefined }))
    delete requestIds.current[activeTab]
    setInitialErrors({}); setJourneyErrors({}); setPassengerErrors({}); setContactErrors({}); setSendError(''); setStep(1)
    closeDialog()
  }

  const fieldId = (field: string) => `booking-${activeTab}-${field}`
  const errors = journeyErrors
  const inputProps = (field: string) => ({ id: fieldId(field), 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `${fieldId(field)}-error` : undefined })
  const locationField = (field: 'pickup' | 'destination' | 'returnPickup' | 'returnDestination' | 'finalDropoff' | 'returnLocation', label: string) => <Field id={fieldId(field)} label={t(label)} error={errors[field]}>
    <PlaceInput inputId={fieldId(field)} value={draft[field].text} onChange={value => updateLocation(field, value)} onMetadataChange={meta => updateLocation(field, undefined, meta)} className="br-control" placeholder={t("City, airport, hotel or address")} label={t(label)} invalid={Boolean(errors[field])} describedBy={errors[field] ? `${fieldId(field)}-error` : undefined} />
  </Field>
  const textField = (field: 'flightNumber' | 'returnFlightNumber' | 'shipName' | 'terminalDetails' | 'exactDestination' | 'plan', label: string, optional = false, disabled = false) => <Field id={fieldId(field)} label={`${t(label)}${optional ? t(' · Optional') : ''}`} error={errors[field]}>
    <input {...inputProps(field)} className="br-control" disabled={disabled} placeholder={t(disabled ? 'Provide later' : undefined)} value={draft[field]} maxLength={field === 'plan' || field === 'terminalDetails' || field === 'exactDestination' ? 500 : 120} onChange={event => updateJourney(field, event.target.value)} />
  </Field>
  const dateField = (field: 'dateTime' | 'returnDateTime' | 'terminalArrival', label: string, hint?: string) => <Field id={fieldId(field)} label={t(label)} error={errors[field]} hint={t(hint)}>
    <BookingDateTime id={fieldId(field)} label={t(label)} invalid={Boolean(errors[field])} describedBy={errors[field] ? `${fieldId(field)}-error` : hint ? `${fieldId(field)}-hint` : undefined} min={field === 'dateTime' ? minDate : draft.dateTime || minDate} value={draft[field]} onChange={value => updateJourney(field, value)} />
  </Field>
  const stopFields = () => <section className="br-section"><div className="br-group-heading"><h3>{t(activeTab === 'hourly' ? 'Planned stops' : 'Stops')}</h3><button type="button" className="br-text-button br-add-stop" onClick={() => updateJourney('stops', [...draft.stops, { id: crypto.randomUUID(), location: blankLocation(), duration: 'Not sure yet', otherDuration: '' }])} disabled={draft.stops.length >= 8}>{"+ "}{t(activeTab === 'hourly' ? 'Add a planned stop' : 'Add a stop')}</button></div>
    {draft.stops.map((stop, index) => {
      const change = (patch: Partial<typeof stop>) => { updateJourney('stops', draft.stops.map(item => item.id === stop.id ? { ...item, ...patch } : item)); setJourneyErrors({}) }
      const minutes = stopDurationMinutes(stop)
      const durationOptions = stopDurations.includes(stop.duration) ? stopDurations : [...stopDurations.slice(0, -2), stop.duration, ...stopDurations.slice(-2)]
      return <div key={stop.id} className="br-stop"><div className="br-stop-fields">
        <Field id={fieldId(`stop-${index}`)} label={message("Stop {0} · Location", t(index + 1))} error={errors[`stop-${index}`]}><PlaceInput inputId={fieldId(`stop-${index}`)} value={stop.location.text} onChange={text => change({ location: { text, metadata: null } })} onMetadataChange={metadata => setDrafts(current => ({ ...current, [activeTab]: { ...current[activeTab], stops: current[activeTab].stops.map(item => item.id === stop.id ? { ...item, location: { ...item.location, metadata } } : item) } }))} className="br-control" label={message("Stop {0} location", t(index + 1))} placeholder={t("Address or place")} invalid={Boolean(errors[`stop-${index}`])} /></Field>
        <Field id={fieldId(`stop-duration-${index}`)} label={t("Stop duration")} error={errors[`stop-duration-${index}`]}><select {...inputProps(`stop-duration-${index}`)} value={stop.duration} className="br-control" onChange={event => change({ duration: event.target.value })}>{durationOptions.map(duration => <option value={duration} key={duration}>{t(duration)}</option>)}</select></Field>
        {stop.duration === 'Other' && <Field id={fieldId(`stop-other-${index}`)} label={t("Other duration")} error={errors[`stop-other-${index}`]}><input {...inputProps(`stop-other-${index}`)} className="br-control" maxLength={80} value={stop.otherDuration} onChange={event => change({ otherDuration: event.target.value })} placeholder={t("For example, 45 minutes")} /></Field>}
      <div className="br-stop-tools"><button type="button" disabled={minutes === null || minutes <= 15} onClick={() => change(stepStopDuration(stop, -1))} aria-label={message("Decrease stop {0} waiting by 15 minutes", t(index + 1))} title={t("−15 minutes")}><Minus size={14} aria-hidden="true" /></button><button type="button" onClick={() => change(stepStopDuration(stop, 1))} aria-label={message("Increase stop {0} waiting by 15 minutes", t(index + 1))} title={t("+15 minutes")}><Plus size={14} aria-hidden="true" /></button><button type="button" onClick={() => { updateJourney('stops', draft.stops.filter(item => item.id !== stop.id)); setJourneyErrors({}) }} aria-label={message('Remove stop {0}', index + 1)} title={t("Remove stop")}><Trash size={14} aria-hidden="true" /></button></div></div></div>
    })}
  </section>
  const availableExtras = bookingExtras.filter(extra => extra.enabled && extra.services.includes(activeTab))
  const bottleExtras = availableExtras.filter(extra => extra.id === 'wine' || extra.id === 'prosecco')
  const bottleSelected = bottleExtras.some(extra => (passengers.extras[extra.id] || 0) > 0)
  const bottleType = (passengers.extras.wine || 0) > 0 && (passengers.extras.prosecco || 0) > 0 ? 'both' : (passengers.extras.prosecco || 0) > 0 ? 'prosecco' : bottleExtras[0]?.id ?? 'wine'
  const selectBottles = (type: string | null) => updatePassengers('extras', {
    ...passengers.extras,
    ...Object.fromEntries(bottleExtras.map(extra => [extra.id, type === 'both' || type === extra.id ? passengers.extras[extra.id] || 1 : 0])),
  })
  const extraQuantity = (id: string, unit: string) => <Field id={`booking-extra-${id}`} label={t(unit)}>
    <select id={`booking-extra-${id}`} className="br-control" value={passengers.extras[id] || 1} onChange={event => updatePassengers('extras', { ...passengers.extras, [id]: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{t(index + 1)}</option>)}</select>
  </Field>
  const essentialReview: ReviewEntry[] = [
    ...(servicesVariant ? [{ label: 'Service', value: quoteLabel }] : []),
    { label: activeTab === 'transfer' ? 'Route' : 'Pick-up', value: activeTab === 'transfer' ? `${draft.pickup.text} → ${draft.destination.text}` : draft.pickup.text },
    { label: activeTab === 'transfer' && context.airportMode === 'pickup' ? 'Flight arrival' : 'Date & time', value: readableDateTime(draft.dateTime) },
    { label: activeTab === 'transfer' ? 'Trip' : activeTab === 'hourly' ? 'Duration' : 'Destination', value: activeTab === 'transfer' ? draft.tripType === 'round-trip' ? 'Round trip' : 'One way' : activeTab === 'hourly' ? draft.duration : draft.exactDestination || draft.category },
    ...(activeTab === 'transfer' && draft.tripType === 'round-trip' ? [{ label: 'Return', value: readableDateTime(draft.returnDateTime) }] : []),
    { label: 'Passengers', value: String(passengers.passengers) },
    { label: 'Luggage', value: `${countLabel(passengers.largeLuggage, 'suitcase')} · ${countLabel(passengers.cabinBags, 'cabinBag')}` },
    { label: 'Journey price', value: 'To be confirmed' },
    ...(selectedExtras(activeTab, passengers).length ? [{ label: 'Selected extras', value: selectedExtras(activeTab, passengers).map(({ extra, quantity }) => `${t(extra.name)} × ${quantity}`).join(', ') }] : []),
    ...(activeTab === 'transfer' && context.water ? [{ label: 'Water taxi', value: draft.waterChoice === 'no' ? 'Arranged by you' : draft.waterChoice === 'yes' ? 'Requested · €100–140 separately' : 'To be discussed · €100–140 separately' }] : []),
  ]
  const navigation = (back: 1 | 2 | null, label: string) => <div className="br-navigation">{back ? <button type="button" className="br-back" onClick={() => setStep(back)} disabled={sending}><ArrowLeft size={16} aria-hidden="true" />{t("Back")}</button> : <span />}<button type="submit" className="br-primary" disabled={sending}>{t(sending ? 'Sending…' : label)}<ArrowRight size={16} aria-hidden="true" /></button></div>

  const bookingDialog = <dialog ref={dialogRef} aria-labelledby="transfer-dialog-title" onCancel={event => { event.preventDefault(); closeDialog() }} onClose={() => setDialogOpen(false)} onClick={event => {
      const dialog = dialogRef.current
      if (!dialog || event.target !== dialog || event.detail === 0) return
      const bounds = dialog.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog()
    }} className="booking-dialog booking-request m-auto max-h-[92svh] w-[calc(100%-24px)] max-w-[820px] overflow-hidden rounded-xl border border-[rgba(111,88,48,0.72)] bg-[rgba(16,17,18,0.98)] p-0 text-cream shadow-[0_32px_100px_rgba(0,0,0,0.72)] backdrop-blur-xl">
      <div className="flex max-h-[92svh] flex-col">
        <header className="shrink-0 border-b border-[rgba(116,111,105,0.28)] px-5 py-4 sm:px-7 sm:py-5"><div className="flex items-start justify-between gap-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{t(servicesVariant ? quoteLabel : serviceNames[activeTab])}</p><h2 ref={headingRef} tabIndex={-1} id="transfer-dialog-title" className="mt-1 font-display text-[28px] font-medium leading-tight text-cream sm:text-[32px]">{t(requestCode ? 'Your request has been sent.' : stepNames[step - 1])}</h2></div><button type="button" disabled={sending} onClick={closeDialog} aria-label={t("Close booking form")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[rgba(116,111,105,0.42)] text-[rgba(236,230,219,0.7)] transition-colors hover:border-gold hover:text-gold-light"><X size={18} aria-hidden="true" /></button></div>
          {!requestCode && <ol className="br-progress" aria-label={t("Booking progress")}>{stepNames.map((name, index) => <li key={name} aria-current={step === index + 1 ? 'step' : undefined} data-complete={step > index + 1}><span>{step > index + 1 ? <Check size={11} aria-hidden="true" /> : index + 1}</span>{t(name)}</li>)}</ol>}
        </header>
        <div ref={dialogScrollRef} className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {requestCode ? <div className="br-success"><CheckCircle size={48} weight="light" aria-hidden="true" /><p>{t("We’ll contact you by your preferred method with availability and your final quote.")}</p><p className="br-reference">{requestCode}</p><p className="br-hint">{t("Your request is not yet a confirmed booking. Confirmation follows agreement of the details and receipt of the deposit.")}</p><div className="br-stop-actions"><button type="button" className="br-back" onClick={closeDialog}>{t("Close")}</button><button type="button" className="br-primary" onClick={startNew}>{t("Start a new request")}</button></div></div>
          : step === 1 ? <form onSubmit={goToPassengers} noValidate>
            <section className="br-summary" aria-label={t("Your initial details")}><MapPin className="br-summary-icon" size={18} weight="light" aria-hidden="true" /><div><p>{draft.pickup.text}{t(activeTab === 'transfer' ? ` → ${draft.destination.text}` : ` · ${t(activeTab === 'hourly' ? draft.duration : draft.category)}`)}</p><p className="br-hint">{t(activeTab === 'transfer' && context.airportMode === 'pickup' ? 'Flight arrival · ' : '')}{t(readableDateTime(draft.dateTime))}</p></div><button type="button" className="br-text-button" aria-expanded={editingInitial} aria-controls="booking-initial-editor" onClick={() => {
              setEditingInitial(current => !current)
              if (!editingInitial) window.requestAnimationFrame(() => document.getElementById(fieldId('pickup'))?.focus())
            }}>{t(editingInitial ? 'Done' : 'Edit')}</button></section>
            {editingInitial && <div id="booking-initial-editor" className="br-grid br-initial-editor">
              {locationField('pickup', 'Pick-up')}
              {t(activeTab === 'transfer' && locationField('destination', 'Destination'))}
              {activeTab === 'hourly' && <Field id={fieldId('duration')} label={t("Duration")} error={errors.duration}><BookingSelect id={fieldId('duration')} label="Duration" showLabel={false} invalid={Boolean(errors.duration)} describedBy={errors.duration ? `${fieldId('duration')}-error` : undefined} className="br-control" value={draft.duration} onChange={value => updateJourney('duration', value)} options={durationOptions} /></Field>}
              {activeTab === 'tours' && <><Field id={fieldId('category')} label={t("Trip category")} error={errors.category}><BookingSelect id={fieldId('category')} label="Trip category" showLabel={false} invalid={Boolean(errors.category)} describedBy={errors.category ? `${fieldId('category')}-error` : undefined} className="br-control" value={draft.category} onChange={value => updateJourney('category', value)} options={tripOptions} /></Field>{t(textField('exactDestination', 'Exact destination or places to visit'))}</>}
              {activeTab === 'transfer' ? dateField('dateTime', context.airportMode === 'pickup' ? 'Flight arrival date & time' : 'Pick-up date & time', context.airportMode === 'pickup' ? 'Use your flight arrival time; we arrange pick-up around it.' : undefined) : <>
                <Field id={fieldId('dateTime')} label={t("Date")} error={errors.dateTime}><BookingDateTime id={fieldId('dateTime')} kind="date" label={t("Date")} min={minDate.slice(0, 10)} invalid={Boolean(errors.dateTime)} describedBy={errors.dateTime ? `${fieldId('dateTime')}-error` : undefined} value={draft.dateTime.slice(0, 10)} onChange={value => updateJourney('dateTime', value ? `${value}T${draft.dateTime.slice(11) || '09:00'}` : '')} /></Field>
                <Field id={fieldId('startTime')} label={t("Start time")}><BookingDateTime id={fieldId('startTime')} kind="time" label={t("Start time")} min={draft.dateTime.slice(0, 10) === minDate.slice(0, 10) ? minDate.slice(11, 16) : undefined} invalid={Boolean(errors.dateTime)} value={draft.dateTime.slice(11)} onChange={value => updateJourney('dateTime', value ? `${draft.dateTime.slice(0, 10) || minDate.slice(0, 10)}T${value}` : '')} /></Field>
              </>}
            </div>}
            {activeTab === 'transfer' && <>
              <section className="br-section"><Choice name="trip-type" label={t("Trip type")} value={draft.tripType} options={[{ value: 'one-way', label: 'One way' }, { value: 'round-trip', label: 'Round trip' }]} onChange={value => updateJourney('tripType', value as JourneyDraft['tripType'])} />
                {draft.tripType === 'round-trip' && <div className="br-detail-panel">
                  <div className="br-return-row">
                    {t(dateField('returnDateTime', context.returnAirportMode === 'pickup' ? 'Return flight arrival' : 'Return date & time'))}
                    <div className="br-route-inline"><span>{t("Return route")}</span><p>{t(context.returnPickup.text)} {t(" → ")}{t(context.returnDestination.text)}</p></div>
                    <Toggle label={t("Different return route")} visualLabel={t("Change route")} checked={draft.differentReturn} onChange={value => {
                      setDrafts(current => ({ ...current, [activeTab]: { ...current[activeTab], differentReturn: value, returnPickup: value && !current[activeTab].returnPickup.text ? current[activeTab].destination : current[activeTab].returnPickup, returnDestination: value && !current[activeTab].returnDestination.text ? current[activeTab].pickup : current[activeTab].returnDestination } }))
                      setJourneyErrors({})
                    }} />
                  </div>
                  {t(draft.differentReturn && <div className="br-grid br-subrow">{t(locationField('returnPickup', 'Return pick-up'))}{t(locationField('returnDestination', 'Return destination'))}</div>)}
                </div>}
              </section>
              {t(stopFields())}
              <section className="br-section br-journey-options"><h3>{t("Journey options")}</h3>
                <div className="br-options-row">
                  {(!draft.pickup.metadata || !draft.destination.metadata) && <Toggle label={t("This journey includes an airport")} visualLabel={t("Airport")} icon={<AirplaneTilt size={15} weight="light" />} checked={draft.airportIncluded} onChange={value => updateJourney('airportIncluded', value)} />}
                  {!context.cruiseDetected && <Toggle label={t("This journey includes a cruise terminal")} visualLabel={t("Cruise terminal")} icon={<Anchor size={15} weight="light" />} checked={draft.cruiseIncluded} onChange={value => updateJourney('cruiseIncluded', value)} />}
                  {!context.waterDetected && <Toggle label={t("This journey needs a Venice water taxi connection")} visualLabel={t("Water taxi")} icon={<Boat size={15} weight="light" />} checked={draft.waterIncluded} onChange={value => updateJourney('waterIncluded', value)} />}
                </div>
                {(context.airportMode || context.returnAirportMode || draft.airportIncluded || (draft.tripType === 'round-trip' && draft.differentReturn)) && <div className="br-detail-panel">
                  {t(draft.airportIncluded && !draft.pickup.metadata?.types.includes('airport') && !draft.destination.metadata?.types.includes('airport') && <Choice name="airport-direction" label={t("Airport service")} value={draft.airportMode} options={[{ value: 'pickup', label: 'Pick-up' }, { value: 'dropoff', label: 'Drop-off' }]} onChange={value => updateJourney('airportMode', value as AirportMode)} />)}
                  {t(draft.tripType === 'round-trip' && draft.differentReturn && (!context.returnPickup.metadata || !context.returnDestination.metadata) && <div className="br-inline-fields br-subrow"><Toggle label={t("The return journey includes an airport")} visualLabel={t("Return airport")} checked={draft.returnAirportIncluded} onChange={value => updateJourney('returnAirportIncluded', value)} />{t(draft.returnAirportIncluded && !context.returnPickup.metadata?.types.includes('airport') && !context.returnDestination.metadata?.types.includes('airport') && <Choice name="return-airport-direction" label={t("Return airport service")} value={draft.returnAirportMode} options={[{ value: 'pickup', label: 'Pick-up' }, { value: 'dropoff', label: 'Drop-off' }]} onChange={value => updateJourney('returnAirportMode', value as AirportMode)} />)}</div>)}
                  {t((context.airportMode || context.returnAirportMode) && <div className="br-airport-fields br-subrow">
                    {t(context.airportMode === 'pickup' && !editingInitial && <div className="br-flight-column br-flight-date">{t(dateField('dateTime', 'Flight arrival date & time'))}</div>)}
                    {t(context.airportMode && <div className="br-flight-column">
                      {t(textField('flightNumber', 'Flight number', context.airportMode === 'dropoff', context.airportMode === 'pickup' && draft.flightUnavailable))}
                      {t(context.airportMode === 'pickup' && <Toggle label={t("Flight details not available yet")} visualLabel={t("Details later")} checked={draft.flightUnavailable} onChange={value => updateJourney('flightUnavailable', value)} />)}
                    </div>)}
                    {t(context.returnAirportMode && <div className="br-flight-column">
                      {t(textField('returnFlightNumber', 'Return flight number', context.returnAirportMode === 'dropoff', context.returnAirportMode === 'pickup' && draft.returnFlightUnavailable))}
                      {t(context.returnAirportMode === 'pickup' && <Toggle label={t("Return flight details not available yet")} visualLabel={t("Details later")} checked={draft.returnFlightUnavailable} onChange={value => updateJourney('returnFlightUnavailable', value)} />)}
                    </div>)}
                  </div>)}
                </div>}
                {context.cruise && <div className="br-detail-panel"><h3>{t("Cruise terminal")}</h3><div className="br-grid br-grid-three br-subrow">{t(textField('shipName', 'Ship name'))}{t(textField('terminalDetails', 'Boarding details', true))}{t(dateField('terminalArrival', 'Terminal arrival · Optional'))}</div></div>}
                {context.water && <div className="br-detail-panel"><Choice name="water-taxi" label={t("Arrange a water taxi connection?")} value={draft.waterChoice} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'I’ll arrange it' }, { value: 'unsure', label: 'Not sure' }]} onChange={value => updateJourney('waterChoice', value as JourneyDraft['waterChoice'])} /><p className="br-hint">{t("Via Piazzale Roma · Est. €100–140, separate from your road transfer.")}</p></div>}
              </section>
            </>}
            {activeTab === 'hourly' && <>
              {estimatedEnd(draft) && <p className="br-hint">{t("Estimated finish: ")}{t(estimatedEnd(draft))}</p>}
              <section className="br-section">{textField('plan', 'Where would you like to go?', true)}<p className="br-hint">{t("Include planned stops and waiting time; waiting within your booked hours is included.")}</p></section>
              {t(stopFields())}
              <section className="br-section br-inline-fields"><Toggle label={t("Final drop-off · Not decided yet")} visualLabel={t("Drop-off not decided")} checked={draft.finalUndecided} onChange={value => updateJourney('finalUndecided', value)} />{t(!draft.finalUndecided && locationField('finalDropoff', 'Final drop-off · Optional'))}</section>
            </>}
            {activeTab === 'tours' && <>
              {!editingInitial && <div className="br-section">{t(textField('exactDestination', 'Destination or places to visit'))}</div>}
              <section className="br-section br-detail-panel"><div className="br-inline-fields"><Toggle label={t("Approximate return time · Not sure yet")} visualLabel={t("Return time not sure")} checked={draft.returnUnsure} onChange={value => updateJourney('returnUnsure', value)} />{!draft.returnUnsure && <Field id={fieldId('approximateReturnTime')} label={t("Approximate return time")} error={errors.approximateReturnTime}><BookingDateTime id={fieldId('approximateReturnTime')} kind="time" label={t("Approximate return time")} invalid={Boolean(errors.approximateReturnTime)} describedBy={errors.approximateReturnTime ? `${fieldId('approximateReturnTime')}-error` : undefined} value={draft.approximateReturnTime} onChange={value => updateJourney('approximateReturnTime', value)} /></Field>}</div>
                <div className="br-return-row br-subrow"><div className="br-route-inline"><span>{t("Return location")}</span><p> {t(draft.differentDayReturn ? draft.returnLocation.text || t('Enter a location below') : draft.pickup.text)}</p></div><Toggle label={t("Different return location")} visualLabel={t("Change return location")} checked={draft.differentDayReturn} onChange={value => {
                  setDrafts(current => ({ ...current, [activeTab]: { ...current[activeTab], differentDayReturn: value, returnLocation: value && !current[activeTab].returnLocation.text ? current[activeTab].pickup : current[activeTab].returnLocation } }))
                  setJourneyErrors({})
                }} />{t(draft.differentDayReturn && locationField('returnLocation', 'Return location'))}</div>
              </section>
              <section className="br-section"><Choice name="day-arrangement" label={t("Journey arrangement")} value={draft.arrangement} options={[{ value: 'Driver stays with us', label: 'Driver stays with us' }, { value: 'Drop-off and return pick-up', label: 'Drop-off & return pick-up' }, { value: 'Help me choose', label: 'Help me choose' }]} onChange={value => updateJourney('arrangement', value as JourneyDraft['arrangement'])}><Toggle label={t("I’d like help planning the itinerary.")} visualLabel={t("Itinerary help")} checked={draft.itineraryHelp} onChange={value => updateJourney('itineraryHelp', value)} /></Choice>{draft.category === 'Prosecco Hills' && <p className="br-hint">{t("Winery visits and tastings are arranged separately unless included in your quote.")}</p>}</section>
            </>}
            {navigation(null, 'Continue')}
          </form>
          : step === 2 ? <form onSubmit={goToReview} noValidate>
            <div className="br-passenger-counters">
              <Counter label={t("Passengers")} hint={t("Including children")} value={passengers.passengers} min={1} max={12} onChange={value => {
                const requested = Number(childSeatCount)
                const validCount = Number.isInteger(requested) && requested >= 1
                const count = Math.min(validCount ? requested : passengers.childAges.length, value)
                setPassengers(current => ({ ...current, passengers: value, childAges: Array.from({ length: count }, (_, index) => current.childAges[index] ?? { value: '', unit: 'years' }) }))
                if (validCount) setChildSeatCount(String(count))
                setPassengerErrors({})
              }} icon={<UsersThree size={21} weight="light" aria-hidden="true" />} />
              <Counter label={t("Large suitcases")} hint={t("Checked luggage")} value={passengers.largeLuggage} onChange={value => updatePassengers('largeLuggage', value)} icon={<SuitcaseRolling size={21} weight="light" aria-hidden="true" />} />
              <Counter label={t("Cabin bags")} hint={t("Hand luggage")} value={passengers.cabinBags} onChange={value => updatePassengers('cabinBags', value)} icon={<Bag size={21} weight="light" aria-hidden="true" />} />
            </div>
            <section className="br-section">
              <div className="br-options-row br-passenger-options">
                <Toggle label={t("Oversized luggage")} icon={<SuitcaseRolling size={16} weight="light" />} checked={passengers.oversized} onChange={value => updatePassengers('oversized', value)} />
                <Toggle label={t("Add child seats")} visualLabel={t("Child seats")} icon={<Baby size={16} weight="light" />} checked={passengers.childSeatsEnabled} onChange={value => updatePassengers('childSeatsEnabled', value)} />
              </div>
              {(passengers.oversized || passengers.childSeatsEnabled) && <div className="br-detail-panel br-passenger-details">
                {passengers.oversized && <Field id="booking-oversized" label={t("Oversized items")} error={passengerErrors.oversizedDetails}><input id="booking-oversized" className="br-control" aria-invalid={Boolean(passengerErrors.oversizedDetails)} value={passengers.oversizedDetails} maxLength={500} placeholder={t("Stroller, ski equipment or other bulky items")} onChange={event => updatePassengers('oversizedDetails', event.target.value)} /></Field>}
                {passengers.childSeatsEnabled && <>
                  <div className="br-child-row">
                    <Field id="booking-child-count" label={t("Child seats")} error={passengerErrors.childSeats}>
                      <input id="booking-child-count" type="number" min={1} max={passengers.passengers} step={1} className="br-control" value={childSeatCount} aria-invalid={Boolean(passengerErrors.childSeats)} onChange={event => {
                        const value = event.target.value
                        setChildSeatCount(value)
                        const count = Number(value)
                        if (Number.isInteger(count) && count >= 1 && count <= passengers.passengers) setPassengers(current => ({ ...current, childAges: Array.from({ length: count }, (_, index) => current.childAges[index] ?? { value: '', unit: 'years' }) }))
                        setPassengerErrors({})
                      }} />
                    </Field>
                    <div className="br-child-ages" data-multiple={passengers.childAges.length > 1}>
                      {t(passengers.childAges.map((age, index) => <Field key={index} id={`booking-child-${index}`} label={t(message("Child {0} · Age", t(index + 1)))} error={passengerErrors[`child-${index}`]}>
                        <div className="br-age">
                          <input id={`booking-child-${index}`} type="number" min={age.unit === 'months' ? 0 : 1} max={age.unit === 'months' ? 11 : 17} step={1} className="br-control" aria-invalid={Boolean(passengerErrors[`child-${index}`])} value={age.value} placeholder={t("Age")} onChange={event => updatePassengers('childAges', passengers.childAges.map((child, i) => i === index ? { ...child, value: event.target.value } : child))} />
                          <div className="br-age-units" role="group" aria-label={t(message("Child {0} age unit", t(index + 1)))}>{t((['years', 'months'] as const).map(unit => <button key={unit} type="button" aria-pressed={age.unit === unit} onClick={() => updatePassengers('childAges', passengers.childAges.map((child, i) => i === index ? { value: '', unit } : child))}>{t(unit === 'years' ? 'Years' : 'Months')}</button>))}</div>
                        </div>
                      </Field>))}
                    </div>
                  </div>
                  <p className="br-hint">{t("For babies under 1, use months. Suitable seats and any charges confirmed with your quote.")}</p>
                </>}
              </div>}
            </section>
            <section className="br-section"><h3>{t("Extras for your journey")}</h3><div className="br-extras">
              {bottleExtras.length > 0 && <div className="br-extra" data-selected={bottleSelected}>
                <label><input className="br-option-input" type="checkbox" checked={bottleSelected} onChange={event => selectBottles(event.target.checked ? bottleType : null)} /><Wine className="br-extra-icon" size={18} weight="light" aria-hidden="true" /><span className="br-extra-copy"><strong>{t("Wine / Prosecco")}</strong><span className="br-hint">{t("Bottles for the journey; tastings are separate.")}</span></span><span className="br-extra-check" aria-hidden="true"><Check size={11} weight="bold" /></span></label>
                {bottleSelected && <>
                  <Field id="booking-bottle-type" label={t("Bottle choice")}><select id="booking-bottle-type" className="br-control" value={bottleType} onChange={event => selectBottles(event.target.value)}>{t(bottleExtras.map(extra => <option key={extra.id} value={extra.id}>{t(extra.name)}</option>))}{t(bottleExtras.length > 1 && <option value="both">{t("Wine & Prosecco")}</option>)}</select></Field>
                  <div className="br-bottle-quantities">{t(bottleExtras.filter(extra => (passengers.extras[extra.id] || 0) > 0).map(extra => <div key={extra.id}>{t(extraQuantity(extra.id, bottleType === 'both' ? message("{0} bottles", t(extra.id === 'wine' ? 'Wine' : 'Prosecco')) : 'Bottles'))}<span className="br-extra-price">{t(extraPriceLabel(extra))}</span></div>))}</div>
                </>}
              </div>}
              {availableExtras.filter(extra => extra.id !== 'wine' && extra.id !== 'prosecco').map(extra => {
                const quantity = passengers.extras[extra.id] || 0
                const ExtraIcon = extraIcons[extra.id as keyof typeof extraIcons] ?? Plus
                return <div key={extra.id} className="br-extra" data-selected={quantity > 0}><label><input className="br-option-input" type="checkbox" checked={quantity > 0} onChange={event => updatePassengers('extras', { ...passengers.extras, [extra.id]: event.target.checked ? 1 : 0 })} /><ExtraIcon className="br-extra-icon" size={18} weight="light" aria-hidden="true" /><span className="br-extra-copy"><strong>{t(extra.name)}</strong><span className="br-extra-price">{t(extraPriceLabel(extra))}</span><span className="br-hint">{t(extra.description)}</span></span><span className="br-extra-check" aria-hidden="true"><Check size={11} weight="bold" /></span></label>{t(quantity > 0 && extra.quantity && extraQuantity(extra.id, extra.unit === 'hour' ? 'Hours' : 'Packages'))}</div>
              })}
            </div><p className="br-hint">{t("Availability and any charges will be confirmed with your quote.")}</p><Field id="booking-special-requests" label={t("Special requests · Optional")}><textarea id="booking-special-requests" rows={3} className="br-control br-textarea" maxLength={500} value={passengers.specialRequests} onChange={event => updatePassengers('specialRequests', event.target.value)} /></Field></section>
            {navigation(1, 'Continue to review')}
          </form>
          : <form onSubmit={submitRequest} noValidate>
            <div className="br-contact-review">
              <section className="br-contact-fields"><h3>{t("Contact details")}</h3>
                {(['fullName', 'email'] as const).map(field => <Field key={field} id={`booking-${field}`} label={t(field === 'fullName' ? 'Full name' : 'Email')} error={contactErrors[field]}><input id={`booking-${field}`} type={field === 'email' ? 'email' : 'text'} autoComplete={field === 'fullName' ? 'name' : 'email'} placeholder={t(field === 'fullName' ? 'e.g. Alex Smith' : 'e.g. alex@example.com')} maxLength={field === 'fullName' ? 120 : 160} aria-invalid={Boolean(contactErrors[field])} aria-describedby={contactErrors[field] ? `booking-${field}-error` : undefined} className="br-control" value={contact[field]} onChange={event => updateContact(field, event.target.value)} /></Field>)}
                <Field id="booking-phone" label={message("Phone / WhatsApp{0}", t(contact.preferredContact === 'email' ? ' · Optional' : ''))} error={contactErrors.phone} hint={t("Choose your country, then enter your number.")}>
                  <Suspense fallback={<div className="br-control" role="status">{t("Loading phone options…")}</div>}>
                    <BookingPhoneInput country={phoneCountry} national={phoneNational} invalid={Boolean(contactErrors.phone)} onChange={next => {
                      setPhoneCountry(next.country)
                      setPhoneNational(next.national)
                      updateContact('phone', next.international)
                    }} />
                  </Suspense>
                </Field>
                <Choice name="preferred-contact" label={t("Preferred contact")} value={contact.preferredContact} options={[{ value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' }]} onChange={value => updateContact('preferredContact', value as ContactDetails['preferredContact'])} />
                <label className="br-consent"><input type="checkbox" checked={contact.consent} onChange={event => updateContact('consent', event.target.checked)} aria-invalid={Boolean(contactErrors.consent)} aria-describedby={contactErrors.consent ? 'booking-consent-error' : undefined} /><span>{t("I agree to be contacted about this request. ")}<a href={pagePath('cookies')} target="_blank" rel="noopener noreferrer">{t("Privacy Policy")}</a>{"."}</span></label>{contactErrors.consent && <p id="booking-consent-error" className="br-error" role="alert">{t(contactErrors.consent)}</p>}
              </section>
              <section className="br-essential-review"><ReviewGroup title={t("Request summary")} entries={essentialReview} onEdit={() => { setEditingInitial(true); setStep(1) }} />
                <button type="button" className="br-text-button" onClick={() => setStep(2)}>{t("Edit passengers & extras")}</button>
                <p className="br-hint">{t("We’ll confirm availability and the final quote. Booking is confirmed after agreement and receipt of the deposit.")}</p>
              </section>
              <section className="br-all-details">
                <button type="button" className="br-details-toggle" aria-expanded={showAllDetails} aria-controls="booking-full-review" onClick={() => setShowAllDetails(current => !current)}><span>{t(showAllDetails ? 'Hide details' : 'Show all details')}</span><ArrowDown size={13} aria-hidden="true" /></button>
                <div id="booking-full-review" hidden={!showAllDetails}>
                <div className="br-review-layout"><ReviewGroup title={t("Your journey")} entries={journeyReview(activeTab, draft, servicesVariant ? quoteLabel : undefined)} onEdit={() => { setEditingInitial(true); setStep(1) }} /><div><ReviewGroup title={t("Passengers & luggage")} entries={passengerReview(passengers)} onEdit={() => setStep(2)} /><ReviewGroup title={t("Price & selected extras")} entries={priceReview(activeTab, draft, passengers)} onEdit={() => setStep(2)} /></div></div>
                </div>
              </section>
            </div>
            {navigation(2, servicesVariant ? 'Send your request' : 'Send booking request')}
            {sendError && <p className="br-error" role="alert">{t(sendError)} {t(" Your details have been kept; you can retry.")}</p>}
          </form>}
        </div>
      </div>
    </dialog>

  const initialDateField = <div className="min-w-0 services-booking-date">{servicesVariant && <label className="services-booking-label" htmlFor="booking-dock-date-time">{t('Date & Time')}</label>}<BookingDateTime dock={!servicesVariant} id="booking-dock-date-time" label={t("Date & Time")} min={minDate} value={draft.dateTime} invalid={Boolean(initialErrors.dateTime)} describedBy={initialErrors.dateTime ? 'booking-dock-date-error' : undefined} onChange={value => updateJourney('dateTime', value)} />{initialErrors.dateTime && <p id="booking-dock-date-error" className="mt-1 text-[12px] text-[var(--error)]" role="alert">{t(initialErrors.dateTime)}</p>}</div>
  const continueButton = <button type="submit" disabled={sending} className="flex min-h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gold px-4 text-[13px] font-semibold tracking-[0.02em] text-[var(--background)] shadow-[0_12px_34px_rgba(194,154,69,0.14)] transition-colors hover:bg-gold-light focus-visible:outline-gold-light sm:min-h-[62px] lg:min-h-[72px]">{t("Continue")}<ArrowRight size={18} weight="bold" aria-hidden="true" /></button>

  return <>
    <div ref={dockRef} data-booking-dock className={`${servicesVariant ? 'services-booking-dock ' : ''}w-full rounded-xl border border-[rgba(194,154,69,0.34)] bg-[rgba(21,25,27,0.94)] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-4 lg:min-h-[188px] lg:p-5`}>
      {!servicesVariant && <div className="booking-type-tabs flex overflow-x-auto border-b border-[rgba(116,111,105,0.46)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={t("Booking type")}>
        {tabs.map((tab, index) => { const TabIcon = tab.icon; const selected = activeTab === tab.id; return <button key={tab.id} type="button" role="tab" id={`booking-tab-${tab.id}`} tabIndex={selected ? 0 : -1} aria-selected={selected} aria-controls={`booking-panel-${tab.id}`} onClick={() => selectTab(tab.id)} onKeyDown={event => {
          let next = index
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
          else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length
          else if (event.key === 'Home') next = 0
          else if (event.key === 'End') next = tabs.length - 1
          else return
          event.preventDefault(); selectTab(tabs[next].id); document.getElementById(`booking-tab-${tabs[next].id}`)?.focus()
        }} className={`relative flex min-w-[138px] shrink-0 items-center justify-center gap-2 px-3 pb-2.5 pt-0.5 text-[12px] font-medium transition-colors sm:min-w-0 sm:flex-none sm:gap-2.5 sm:px-4 sm:pb-3 sm:text-[14px] lg:justify-start lg:px-5 lg:text-[15px] ${tab.width} ${selected ? 'text-gold-light' : 'text-[rgba(200,192,181,0.72)] hover:text-cream'}`}>
          <TabIcon size={20} weight="light" aria-hidden="true" /><span className="whitespace-nowrap"><span className="home-desktop-copy">{t(tab.label)}</span><span className="home-mobile-copy">{t(tab.mobileLabel)}</span></span><span className={`absolute inset-x-3 bottom-0 h-px origin-left bg-gold transition-transform duration-300 lg:inset-x-5 ${selected ? 'scale-x-100' : 'scale-x-0'}`} aria-hidden="true" />{tab.id !== 'tours' && <span className="absolute right-0 top-0.5 h-6 w-px bg-[rgba(116,111,105,0.46)]" aria-hidden="true" />}
        </button> })}
      </div>}
      <div id={`booking-panel-${activeTab}`} role={servicesVariant ? undefined : 'tabpanel'} aria-labelledby={servicesVariant ? undefined : `booking-tab-${activeTab}`} className={servicesVariant ? 'services-booking-panel' : 'pt-3 lg:pt-4'}>
        <form onSubmit={openRequest} noValidate><div className={servicesVariant ? 'services-booking-fields' : 'grid grid-cols-1 gap-2 md:grid-cols-2 sm:gap-2.5 lg:grid-cols-[1.1fr_1.1fr_1fr_150px] lg:gap-3'}>
          {servicesVariant && <ServiceSelect value={quoteService} onChange={selectQuoteService} />}
          {servicesVariant && initialDateField}
          <FieldShell label={t("Pick-up")} icon={<MapPin size={23} weight="light" aria-hidden="true" />} error={initialErrors.pickup}><PlaceInput value={draft.pickup.text} onChange={value => updateLocation('pickup', value)} onMetadataChange={meta => updateLocation('pickup', undefined, meta)} placeholder={t(mobileHero ? 'City, airport or address' : 'City, airport, address, hotel...')} className={controlClass} label={t("Pick-up")} invalid={Boolean(initialErrors.pickup)} /></FieldShell>
          <FieldShell label={t(activeTab === 'transfer' ? 'Destination' : activeTab === 'hourly' ? 'Duration' : 'Trip destination')} icon={activeTab === 'hourly' ? <Clock size={23} weight="light" aria-hidden="true" /> : activeTab === 'tours' ? <Compass size={23} weight="light" aria-hidden="true" /> : <MapPin size={23} weight="light" aria-hidden="true" />} error={initialErrors.destination || initialErrors.duration || initialErrors.category}>
            {activeTab === 'transfer' ? <PlaceInput value={draft.destination.text} onChange={value => updateLocation('destination', value)} onMetadataChange={meta => updateLocation('destination', undefined, meta)} placeholder={t(mobileHero ? 'City, airport or address' : 'City, airport, address, hotel...')} className={controlClass} label={t("Destination")} invalid={Boolean(initialErrors.destination)} /> : <BookingSelect label={activeTab === 'hourly' ? 'Duration' : 'Trip destination'} showLabel={false} inline value={activeTab === 'hourly' ? draft.duration : draft.category} onChange={value => updateJourney(activeTab === 'hourly' ? 'duration' : 'category', value)} options={activeTab === 'hourly' ? durationOptions : tripOptions} invalid={Boolean(initialErrors.duration || initialErrors.category)} />}
          </FieldShell>
          {!servicesVariant && initialDateField}
          {servicesVariant ? <div className="services-booking-action">{continueButton}<p className="sv-quote-next">{t('Next: journey details, passengers and extras.')}</p></div> : continueButton}
          {activeTab === 'tours' && draft.category === 'Other destination' && <div className="md:col-span-2 lg:col-span-4"><FieldShell label={t("Other destination")} icon={<MapPin size={23} aria-hidden="true" />} error={initialErrors.exactDestination}><input value={draft.exactDestination} maxLength={500} onChange={event => updateJourney('exactDestination', event.target.value)} className={controlClass} placeholder={t("Where would you like to go?")} aria-label={t("Other destination")} aria-invalid={Boolean(initialErrors.exactDestination)} /></FieldShell></div>}
        </div></form>
      </div>
    </div>

    {servicesVariant ? (typeof document !== 'undefined' ? createPortal(bookingDialog, document.body) : null) : bookingDialog}
  </>
}
