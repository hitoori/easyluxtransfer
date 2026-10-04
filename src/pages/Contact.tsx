import { message as translateMessage, t, useLocale } from '../i18n/locale'
import OptimizedImage from '../components/OptimizedImage'
import { useRef, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { EnvelopeSimple, Phone, WhatsappLogo, MapPin, AirplaneTilt, Boat, Mountains, GlobeHemisphereWest, Anchor, Waves } from '@phosphor-icons/react'
import { ArrowRight, Clock, Message, Check, Plus } from '../components/PikaIcons'
import { serviceOptions } from '../components/services/serviceData'
import { pagePath, type Page } from '../types/navigation'
import { company } from '../config/company'
import { sendBooking } from '../lib/sendBooking'
import './contact.css'
import { publicAsset } from '../lib/publicAsset'

const services = serviceOptions.map(([, label]) => label)
const popularServices = [
  { label: 'Airport & City', id: 'airport', Icon: AirplaneTilt },
  { label: 'By the Hour', id: 'hourly', Icon: Clock },
  { label: 'Water Taxi', id: 'water-taxi', Icon: Boat },
  { label: 'Italy & Europe', id: 'europe', Icon: GlobeHemisphereWest },
  { label: 'Mountains', id: 'mountains', Icon: Mountains },
  { label: 'Seaside', id: 'coast', Icon: Waves },
  { label: 'Cruise Ports', id: 'cruise', Icon: Anchor },
]
const quickAnswers = [
  ['Can I request a destination that isn’t listed?', 'Yes. Choose “Custom destination” in the form and tell us your route. We’ll check if we can arrange it.'],
  ['Does sending an enquiry book my transfer?', 'No. We’ll check availability and send you a quote. Your booking is confirmed after you accept the details and we confirm it with you.'],
  ['Can I request stops or a return transfer?', 'Yes. Tell us about any stops or a return journey, including the dates and approximate times. We’ll include them in your quote.'],
]

const contactChannels = [
  { label: 'WhatsApp', links: company.phones.map(phone => ({ value: phone.display, href: phone.whatsapp })), Icon: WhatsappLogo, note: 'Message us about your journey' },
  { label: 'Call us', links: company.phones.map(phone => ({ value: phone.display, href: phone.tel })), Icon: Phone, note: 'Discuss your plans with us' },
  { label: 'Email', links: [{ value: company.email, href: `mailto:${company.email}` }], Icon: EnvelopeSimple, note: "We'll reply as soon as possible" },
]

export default function Contact({ navigate }: { navigate: (page: Page, sectionId?: string) => void }) {
  useLocale()
  const pageRef = useRef<HTMLDivElement>(null)
  useScrollReveal(pageRef, '.ct-concierge > *, .ct-information > article, .ct-services-heading, .ct-services-marquee, .ct-faq')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')
  const [requestCode, setRequestCode] = useState('')
  const [openAnswer, setOpenAnswer] = useState<number | null>(null)
  const viewService = (id: string) => {
    navigate('services', `service-${id}`)
  }
  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    setSending(true); setSendStatus('')
    try {
      const code = await sendBooking({ kind: 'custom', source: 'contact', service: service || 'General enquiry', name, email, phone, details: `Service: ${service || 'General enquiry'}\nMessage: ${message}`, consent }, crypto.randomUUID())
      setRequestCode(code)
      setSendStatus(`Your enquiry has been sent. Reference ${code}. A confirmation has been emailed to ${email}.`)
    } catch (error) { setSendStatus(error instanceof Error ? error.message : 'The request could not be sent. Please try again.') }
    finally { setSending(false) }
  }

  return (
    <div ref={pageRef} className="contact-page">
      <header className="ct-hero" aria-labelledby="contact-title">
        <OptimizedImage className="ct-hero-image" src={publicAsset('images/home/hero/venice-grand-canal.jpg')} alt={""} fetchPriority="high" />
        <div className="ct-shell ct-hero-content">
          <div>
            <p className="ct-kicker">{t("Contact Easy Lux")}</p>
            <h1 id="contact-title">{t("Let's plan your journey.")}</h1>
            <p className="ct-intro">{t("Tell us where and when you’d like to travel. We’ll check availability and send a quote. Questions are welcome, too.")}</p>
            {/* TODO: Confirm response-time and opening-hours claims before publishing them. */}
            <div className="ct-trust" aria-label={t("Ways to connect")}>
              <div><Clock size={17} aria-hidden="true" /><span>{t("Direct contact")}<br /><strong>{t("With our team")}</strong></span></div>
              <div><MapPin size={18} weight="light" aria-hidden="true" /><span>{t("Based in Venice and Treviso")}<br /><strong>{t("Across Italy and Europe")}</strong></span></div>
              <div><Message size={17} aria-hidden="true" /><span>{t("WhatsApp")}<br /><strong>{t("Send us your route")}</strong></span></div>
            </div>
          </div>
        </div>
      </header>

      <section className="ct-concierge ct-shell" aria-label={t("Plan your journey with Easy Lux")}>


        <div className="ct-form-panel">
          <div className="ct-form-heading">
            <div>
              <h2>{t("Send us a message")}</h2><p>{t("Tell us your route and date, or ask a question. If you’re flying in, include your flight number.")}</p>
            </div>
          </div>

          <form onSubmit={submitContact} onChange={() => { if (sendStatus && !requestCode) setSendStatus('') }}>
            <div className="ct-fields">
              <label htmlFor="ct-name">{t("Full name")}<input id="ct-name" name="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder={t("Your name")} required />
              </label>
              <label htmlFor="ct-email">{t("Email address")}<input id="ct-email" name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t("you@example.com")} required />
              </label>
              <label htmlFor="ct-phone">{t("Phone ")}<span>{t("(optional)")}</span>
                <input id="ct-phone" name="phone" type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder={t("Include country code")} />
              </label>
              <label htmlFor="ct-service">{t("Service ")}<span>{t("(optional)")}</span>
                <select id="ct-service" name="service" value={service} onChange={event => setService(event.target.value)}>
                  <option value="">{t("Select a service")}</option>
                  {services.map(item => <option value={item} key={item}>{t(item)}</option>)}
                </select>
              </label>
            </div>

            <label className="ct-message-field" htmlFor="ct-message">{t("Journey details or question")}<textarea id="ct-message" name="message" rows={4} value={message} onChange={event => setMessage(event.target.value)} placeholder={t("Pick-up, destination, date and time, passengers, luggage and any special requests…")} required />
            </label>

            <label className="ct-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /> <span>{t("I agree to be contacted about this enquiry. ")}<a href={pagePath('cookies')} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">{t("Privacy Policy")}</a>{"."}</span></label>

            <div className="ct-submit">
              <button type="submit" className="ct-primary" disabled={sending || Boolean(requestCode)}>{t(sending ? 'Sending…' : requestCode ? 'Enquiry sent' : 'Send enquiry')} <ArrowRight size={18} aria-hidden="true" /></button>
              <p className="ct-privacy"><EnvelopeSimple size={16} weight="light" aria-hidden="true" /><span>{t("We’ll email you to confirm we received your enquiry. Your transfer is confirmed separately.")}</span></p>
            </div>

            {sendStatus && <div className="ct-draft" role={requestCode ? 'status' : 'alert'}>
              <div><span>{t(requestCode ? 'Received' : 'Please try again')}</span><h3>{t(requestCode ? 'Your enquiry is on its way.' : 'We could not send your enquiry.')}</h3></div>
              <p>{requestCode ? translateMessage('Your enquiry has been sent. Reference {0}. A confirmation has been emailed to {1}.', requestCode, email) : t(sendStatus)}</p>
            </div>}
          </form>
        </div>

        <aside className="ct-contact-panel" data-reveal-delay="70" aria-labelledby="ct-direct-title">
          <div>
            <h2 id="ct-direct-title">{t("Speak with us directly")}</h2>
          </div>

          <div className="ct-channels">
            {contactChannels.map(({ label, links, Icon, note }) => <div className="ct-channel" key={label}>
              <Icon size={20} weight="light" aria-hidden="true" />
              <div><span>{t(label)}</span><div className="ct-channel-links">{links.map(({ value, href }, index) => <span className="ct-channel-number" key={href}>{index > 0 && <span className="ct-phone-divider" aria-hidden="true">{t("/")}</span>}<a href={href} aria-label={`${t(label)}: ${value}`}><strong>{value}</strong></a></span>)}<ArrowRight size={15} aria-hidden="true" /></div><small>{t(note)}</small></div>
            </div>)}
          </div>

          <div className="ct-area">
            <OptimizedImage src={publicAsset('images/home/water-taxi/venice-water-taxi.jpg')} alt={""} loading="lazy" />
            <div><span><MapPin size={17} weight="light" aria-hidden="true" />{t("Our operational base")}</span>
              <h3>{t("Venice, Italy")}</h3>
              <p>{t(company.serviceArea)}</p>
              <a href="#services" className="ct-inline-link" onClick={event => { event.preventDefault(); viewService('europe') }}>{t("View service area ")}<ArrowRight size={17} aria-hidden="true" /></a>
            </div>
          </div>
        </aside>
      </section>

      <section className="ct-information ct-shell" aria-label={t("Planning your transfer")}>
        <article>
          <p className="ct-info-label">{t("Your enquiry")}</p><h2>{t("Before you write")}</h2>
          <ul className="ct-info-list">{[
            ['Your route & timing', 'Pickup, destination, travel date and approximate time.'],
            ['Your travel party', 'Number of passengers and the amount of luggage.'],
            ['The extra details', 'Child seats, planned stops or any special requests.'],
          ].map(([title, text]) => <li key={title}><Check size={16} aria-hidden="true" /><div><h3>{t(title)}</h3><p>{t(text)}</p></div></li>)}</ul>
        </article>
        <article className="ct-info-featured" data-reveal-delay="70">
          <p className="ct-info-label">{t("The next steps")}</p><h2>{t("From request to pickup")}</h2>
          <ol className="ct-info-list ct-info-timeline">{[
            ['Tell us your plans', 'Fill in the form or contact us directly.'],
            ['Review your quote', 'We check availability and agree the details with you.'],
            ['Meet your driver', 'Your meeting instructions are confirmed before travel.'],
          ].map(([title, text], i) => <li key={title}><span className="ct-info-number">{"0"}{t(i + 1)}</span><div><h3>{t(title)}</h3><p>{t(text)}</p></div></li>)}</ol>
        </article>
        <article data-reveal-delay="140">
          <p className="ct-info-label">{t("Travel details")}</p><h2>{t("Good to know")}</h2>
          <ul className="ct-info-list">{[
            ['Arriving by air', 'Share your flight number so we can follow your arrival.'],
            ['A pickup that suits you', 'Airports, hotels, stations and cruise ports.'],
            ['Room for your plans', 'Request stops or a return trip; mention child seats and extra bags.'],
          ].map(([title, text]) => <li key={title}><Check size={16} aria-hidden="true" /><div><h3>{t(title)}</h3><p>{t(text)}</p></div></li>)}</ul>
          {/* TODO: Confirm invoices, payment methods, languages and driver-contact delivery before adding these company claims. */}
        </article>
      </section>

      <nav className="ct-services ct-shell" aria-labelledby="ct-services-title">
        <div className="ct-services-heading"><div><p className="ct-info-label">{t("Ways to travel")}</p><h2 id="ct-services-title">{t("Explore our services")}</h2></div></div>
        <div className="ct-services-marquee"><div className="ct-services-track">{[0, 1].map(copy => <div className="ct-services-set" key={copy} aria-hidden={copy === 1 || undefined}>{popularServices.map(({ label, id, Icon }) => <a key={`${copy}-${label}`} href="#services" tabIndex={copy === 1 ? -1 : undefined} onClick={event => { event.preventDefault(); viewService(id) }}><span className="ct-service-icon"><Icon size={20} aria-hidden="true" /></span><strong>{t(label)}</strong><ArrowRight size={16} aria-hidden="true" /></a>)}</div>)}</div></div>
      </nav>

      <section className="ct-faq ct-shell" aria-labelledby="ct-faq-title">
        <div className="ct-faq-heading"><div><p className="ct-kicker">{t("Useful to know")}</p><h2 id="ct-faq-title">{t("Quick answers")}</h2></div><a href="#faq" className="ct-inline-link" onClick={event => { event.preventDefault(); navigate('faq') }}>{t("Explore all FAQs ")}<ArrowRight size={17} aria-hidden="true" /></a></div>
        {quickAnswers.map(([question, answer], index) => <article key={question} className="ct-answer"><h3><button id={`ct-question-${index}`} aria-expanded={openAnswer === index} aria-controls={`ct-answer-${index}`} onClick={() => setOpenAnswer(openAnswer === index ? null : index)}>{t(question)}<Plus size={18} aria-hidden="true" /></button></h3><div id={`ct-answer-${index}`} role="region" aria-labelledby={`ct-question-${index}`} className={`ct-answer-body${openAnswer === index ? ' is-open' : ''}`} aria-hidden={openAnswer !== index}><div><p>{t(answer)}</p></div></div></article>)}
      </section>
    </div>
  )
}
