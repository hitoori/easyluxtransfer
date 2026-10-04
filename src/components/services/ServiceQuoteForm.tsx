import { countLabel, t, useLocale } from '../../i18n/locale'
import { pagePath } from '../../types/navigation'
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { ArrowLeft, ArrowRight, Check, Plus } from '@phosphor-icons/react'
import { serviceOptions, type QuoteSelection } from './serviceData'
import { initialQuote, localDate, validateQuote, type QuoteDraft, type QuoteErrors } from './quoteModel'
import { sendBooking } from '../../lib/sendBooking'

export default function ServiceQuoteForm({ selection }: { selection: QuoteSelection | null }) {
  useLocale()
  const [draft, setDraft] = useState<QuoteDraft>(initialQuote)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<QuoteErrors>({})
  const [notesOpen, setNotesOpen] = useState(false)
  const [prepared, setPrepared] = useState(false)
  const [sending, setSending] = useState(false)
  const [requestCode, setRequestCode] = useState('')
  const [status, setStatus] = useState('')
  const [consent, setConsent] = useState(false)
  const requestId = useRef(crypto.randomUUID())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const needsFocus = useRef(false)

  useEffect(() => {
    if (!selection) return
    setDraft(previous => ({ ...previous, service: selection.service, pickup: selection.pickup ?? '', destination: selection.destination ?? '', airportPickup: selection.airportPickup ?? false, addReturn: selection.addReturn ?? false }))
    setStep(0); setErrors({}); setPrepared(false); setSending(false); setRequestCode(''); setStatus(''); setConsent(false); requestId.current = crypto.randomUUID()
    headingRef.current?.focus({ preventScroll: true })
    const section = document.getElementById('service-custom')
    const anchor = section?.querySelector<HTMLElement>('.sv-quote-layout') ?? section
    if (anchor) {
      const headerHeight = window.matchMedia('(min-width: 1024px)').matches ? 76 : 72
      const directoryHeight = document.querySelector('.services-masthead-nav')?.getBoundingClientRect().height ?? 64
      const top = anchor.getBoundingClientRect().top + window.scrollY - headerHeight - directoryHeight - 24
      window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  }, [selection])

  useEffect(() => {
    if (needsFocus.current) { headingRef.current?.focus({ preventScroll: true }); headingRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' }); needsFocus.current = false }
  }, [step, prepared])

  const update = <K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) => {
    setDraft(previous => ({ ...previous, [key]: value }))
    setErrors(previous => ({ ...previous, [key]: undefined }))
  }
  const goTo = (next: number) => { needsFocus.current = true; setErrors({}); setStep(next) }
  const input = (key: keyof QuoteDraft, label: string, options: InputHTMLAttributes<HTMLInputElement> = {}) => <label className="sv-field" htmlFor={`quote-${key}`}>
    <span id={`quote-label-${key}`}>{t(label)}</span><input id={`quote-${key}`} name={key} value={String(draft[key])} onInput={event => update(key, event.currentTarget.value as never)} onChange={event => update(key, event.target.value as never)} aria-labelledby={`quote-label-${key}`} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `quote-error-${key}` : undefined} {...options} placeholder={t(options.placeholder)} />
    {errors[key] && <small id={`quote-error-${key}`} className="sv-field-error">{t(errors[key])}</small>}
  </label>
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    // Re-check previous steps before preparing a request; hidden fields never bypass validation.
    for (let index = 0; index <= step; index++) {
      const nextErrors = validateQuote(draft, index)
      const first = Object.keys(nextErrors)[0]
      if (first) {
        setErrors(nextErrors); setStep(index)
        window.requestAnimationFrame(() => document.getElementById(`quote-${first}`)?.focus())
        return
      }
    }
    if (step < 2) goTo(step + 1)
    else {
      if (sending) return
      if (!consent) { setStatus('Please agree to be contacted about this request.'); return }
      setSending(true); setStatus('')
      const details = [
        `Pick-up: ${draft.pickup}`, `Destination: ${draft.destination}`, `Departure: ${draft.date} · ${draft.time}`,
        `Passengers: ${draft.passengers}`, `Luggage: ${draft.luggage} bags`, draft.vehicle && `Vehicle: ${draft.vehicle}`,
        draft.airportPickup && `Airport pick-up · Flight: ${draft.flight}`,
        draft.addReturn && `Return: ${draft.returnDate} · ${draft.returnTime}`,
        draft.service === 'hourly' && `Duration: ${draft.duration}\nSchedule: ${draft.stops}`,
        draft.service === 'cruise' && `Cruise: ${draft.ship} · ${draft.terminal} · ${draft.shipTime}`,
        draft.equipment && `Equipment: ${draft.equipment}`, draft.notes && `Special requests: ${draft.notes}`,
      ].filter(Boolean).join('\n')
      try {
        const code = await sendBooking({ kind: 'custom', source: 'services-quote', service: serviceOptions.find(([value]) => value === draft.service)?.[1] || 'Transfer quote', name: draft.name, email: draft.email, phone: draft.phone, details, consent }, requestId.current)
        setRequestCode(code); setPrepared(true); needsFocus.current = true
      } catch (error) { setStatus(error instanceof Error ? error.message : 'The request could not be sent.') }
      finally { setSending(false) }
    }
  }
  const review = <dl className="sv-review">
    <div><dt>{t("Service")}</dt><dd>{t(serviceOptions.find(([value]) => value === draft.service)?.[1])}</dd></div>
    <div><dt>{t("Journey")}</dt><dd>{draft.pickup} {" → "}{draft.destination}</dd></div>
    <div><dt>{t("Pick-up")}</dt><dd>{draft.date} {" · "}{draft.time}</dd></div>
    <div><dt>{t("Travellers")}</dt><dd>{countLabel(draft.passengers, 'passenger')} · {countLabel(draft.luggage, 'bag')}{t(draft.vehicle ? ` · ${t(draft.vehicle)}` : '')}</dd></div>
    {draft.airportPickup && <div><dt>{t("Flight")}</dt><dd>{draft.flight}</dd></div>}
    {draft.addReturn && <div><dt>{t("Return")}</dt><dd>{draft.returnDate} {" · "}{draft.returnTime} {t(" — quoted separately")}</dd></div>}
    {draft.service === 'hourly' && <><div><dt>{t("Duration")}</dt><dd>{t(draft.duration)}</dd></div><div><dt>{t("Schedule")}</dt><dd>{draft.stops}</dd></div></>}
    {draft.service === 'cruise' && <div><dt>{t("Cruise")}</dt><dd>{draft.ship} {" · "}{draft.terminal} {" · "}{draft.shipTime}</dd></div>}
    {draft.notes && <div><dt>{t("Requests")}</dt><dd>{draft.notes}</dd></div>}
    {draft.equipment && <div><dt>{t("Equipment")}</dt><dd>{draft.equipment}</dd></div>}
  </dl>

  return <section id="service-custom" className="sv-section sv-quote-section" aria-labelledby="quote-intro-title"><div className="svc-shell sv-quote-layout">
    <div className="sv-copy sv-quote-copy"><p className="svc-eyebrow">{t("Request a private transfer quote")}</p><h2 id="quote-intro-title">{t("Request a quote for your transfer.")}</h2><p className="sv-lead">{t("Tell us where and when you need to travel. We’ll confirm the vehicle and price before you decide.")}</p></div>
    <div className="sv-quote-panel">
      <h3 ref={headingRef} tabIndex={-1} className="sv-form-title">{t(prepared ? 'Check your journey details.' : 'Your journey details')}</h3>
      {prepared ? <div className="sv-prepared"><Check size={32} aria-hidden="true" /><p role="status">{t("Your request has been sent. Reference ")}{requestCode}{"."}</p><p>{t("We’ve emailed a confirmation to ")}{draft.email}{t(". Our team will contact you to discuss the journey and quote.")}</p>{review}<button type="button" className="sv-button" onClick={() => { setPrepared(false); setStep(0); setDraft(initialQuote); setRequestCode(''); requestId.current = crypto.randomUUID(); needsFocus.current = true }}>{t("Send another request ")}<ArrowLeft size={20} /></button></div> : <>
        <ol className="sv-form-steps" aria-label={t("Request progress")}>{['Journey', 'Passengers', 'Contact'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}><button type="button" disabled={index > step} onClick={() => goTo(index)}><span>{t(String(index + 1).padStart(2, '0'))}</span> {t(label)}</button></li>)}</ol>
        <form className="sv-quote-form" onSubmit={submit} noValidate>
          {Object.values(errors).some(Boolean) && <p role="alert" className="sv-error-summary">{t("Please check the highlighted details before continuing.")}</p>}
          {step === 0 && <fieldset><legend className="sv-sr-only">{t("Journey details")}</legend>
            <label className="sv-field sv-service-field" htmlFor="quote-service"><span>{t("Service")}</span><select id="quote-service" name="service" value={draft.service} onChange={event => { update('service', event.target.value as QuoteDraft['service']); setErrors({}) }}>{serviceOptions.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
            <div className="sv-fields-grid">
              {input('pickup', 'Pick-up', { placeholder: 'Airport, hotel or address', required: true, autoComplete: 'off' })}
              {input('destination', 'Destination', { placeholder: 'Where would you like to go?', required: true, autoComplete: 'off' })}
              {input('date', 'Date', { type: 'date', required: true, min: localDate() })}
              {input('time', 'Time', { type: 'time', required: true })}
            </div>
            <div className="sv-checkboxes"><label><input type="checkbox" checked={draft.airportPickup} onChange={event => update('airportPickup', event.target.checked)} />{t("Airport pick-up")}</label><label><input type="checkbox" checked={draft.addReturn} onChange={event => update('addReturn', event.target.checked)} />{t("Add a return")}</label></div>
            {draft.airportPickup && <div className="sv-conditional">{t(input('flight', 'Flight number', { placeholder: 'e.g. BA598', required: true }))}<p className="sv-fine-print">{t("Your flight details help us coordinate the airport meeting.")}</p></div>}
            {draft.addReturn && <div className="sv-conditional"><div className="sv-fields-grid">{t(input('returnDate', 'Return date', { type: 'date', min: draft.date || localDate(), required: true }))}{t(input('returnTime', 'Return time', { type: 'time', required: true }))}</div><p className="sv-fine-print">{t("A return or later collection is quoted separately. Add any waiting requirements below.")}</p></div>}
            {draft.service === 'hourly' && <div className="sv-conditional sv-fields-grid">{t(input('duration', 'Approximate duration', { placeholder: 'e.g. 4 hours', required: true }))}{t(input('stops', 'Planned stops & waiting', { placeholder: 'Addresses and schedule', required: true }))}</div>}
            {draft.service === 'cruise' && <div className="sv-conditional sv-fields-grid">{t(input('ship', 'Ship name', { placeholder: 'Your cruise ship', required: true }))}{t(input('terminal', 'Cruise terminal', { placeholder: 'Port and terminal', required: true }))}{t(input('shipTime', 'Boarding / disembarkation time', { type: 'time', required: true }))}</div>}
            <button type="button" className="sv-notes-toggle" aria-expanded={notesOpen} aria-controls="quote-notes-panel" onClick={() => setNotesOpen(!notesOpen)}>{t("Add stops or special requests ")}<Plus size={23} className={notesOpen ? 'sv-plus-open' : ''} aria-hidden="true" /></button>
            <div id="quote-notes-panel" hidden={!notesOpen}><label className="sv-field" htmlFor="quote-notes"><span className="sv-sr-only">{t("Stops or special requests")}</span><textarea id="quote-notes" rows={3} value={draft.notes} onChange={event => update('notes', event.target.value)} placeholder={t("Stops, waiting, accessibility or anything else we should know")} /></label></div>
          </fieldset>}
          {step === 1 && <fieldset><legend className="sv-step-heading">{t("Passengers, luggage & vehicle")}</legend><div className="sv-fields-grid">
            {input('passengers', 'Passengers', { type: 'number', min: 1, max: 12, required: true, inputMode: 'numeric' })}
            {input('luggage', 'Bags & suitcases', { type: 'number', min: 0, required: true, inputMode: 'numeric' })}
            <label className="sv-field sv-span-two" htmlFor="quote-vehicle"><span>{t("Vehicle preference · optional")}</span><select id="quote-vehicle" value={draft.vehicle} onChange={event => update('vehicle', event.target.value)}><option value="">{t("Recommend a suitable vehicle")}</option><option value="Sedan">{t("Sedan")}</option><option value="Van">{t("Van")}</option><option value="Minibus 12">{t("Minibus 12")}</option></select></label>
            <label className="sv-field sv-span-two" htmlFor="quote-equipment"><span>{t("Child seats or equipment · optional")}</span><textarea id="quote-equipment" rows={3} value={draft.equipment} onChange={event => update('equipment', event.target.value)} placeholder={t("Child ages, skis, pushchairs or other equipment")} /></label>
          </div><p className="sv-fine-print">{t("Vehicle suitability and any extras are confirmed after reviewing your passengers and luggage.")}</p></fieldset>}
          {step === 2 && <fieldset><legend className="sv-step-heading">{t("Your contact details")}</legend><div className="sv-fields-grid">{input('name', 'Full name', { autoComplete: 'name', required: true, placeholder: 'Your full name' })}{input('email', 'Email', { type: 'email', autoComplete: 'email', required: true, placeholder: 'your@email.com' })}{input('phone', 'Phone / WhatsApp · optional', { type: 'tel', autoComplete: 'tel', placeholder: '+39…' })}</div><h4 className="sv-review-heading">{t("Review your journey")}</h4>{review}<button type="button" className="sv-text-link" onClick={() => goTo(0)}>{t("Edit journey details")}</button><label className="sv-fine-print"><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setStatus('') }} /> <span>{t("I agree to be contacted about this quote request. ")}<a href={pagePath('cookies')} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">{t("Privacy Policy")}</a>{"."}</span></label></fieldset>}
          {status && <p role="alert" className="sv-error-summary">{t(status)}</p>}
          <div className="sv-form-actions">{step > 0 && <button type="button" className="sv-back" onClick={() => goTo(step - 1)} aria-label={t("Previous step")}><ArrowLeft size={21} />{t("Back")}</button>}<button type="submit" className="sv-button sv-button-gold" disabled={sending}>{t(sending ? 'Sending…' : step === 0 ? 'Continue to passengers' : step === 1 ? 'Continue to contact' : 'Send your request')}<ArrowRight size={25} aria-hidden="true" /></button></div>
          <p className="sv-form-helper">{t(step === 0 ? 'Your next step: passengers, luggage and vehicle preference.' : step === 1 ? 'Next: contact details and journey review.' : 'No booking is made until the journey and price are confirmed.')}</p>
        </form>
      </>}
    </div>
  </div></section>
}
