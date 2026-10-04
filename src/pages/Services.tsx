import { t, useLocale } from '../i18n/locale'
import OptimizedImage from '../components/OptimizedImage'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Page } from '../types/navigation'
import { serviceOptions, type JourneyRequest, type JourneyService, type QuoteSelection } from '../components/services/serviceData'
import { HourlySection, WaterTaxiSection, EuropeSection, MountainsSection, SeasideSection, CruiseSection } from '../components/services/SelectedServiceSections'
import ProseccoHills from '../components/services/ProseccoHills'
import ServiceQuoteForm from '../components/services/ServiceQuoteForm'
import './services.css'
import './services-selected.css'
import './services-hourly.css'
import './services-water-taxi.css'
import './services-europe.css'
import './services-mountains.css'
import './services-seaside.css'
import './services-hero.css'
import './services-unified.css'
import './services-refinements.css'
import './services-experience.css'
import './services-hourly-editorial.css'
import './services-water-taxi-editorial.css'
import './services-europe-editorial.css'
import './services-mountains-editorial.css'
import './services-final-polish.css'
import '../components/services/hourly-mockup.css'
import './services-spacing.css'
import './services-route-style.css'
import './services-section-polish.css'
import './services-water-taxi-reference.css'
import { publicAsset } from '../lib/publicAsset'
import './services-home-routes.css'
import './services-masthead-refresh.css'
import AirportTransfers from '../components/services/AirportTransfers'
import PricingGuide from '../components/services/PricingGuide'
import FloatingServiceNav from '../components/services/FloatingServiceNav'

export default function Services({ navigate }: { navigate: (page: Page) => void }) {
  useLocale()
  const pageRef = useRef<HTMLDivElement>(null)
  useScrollReveal(pageRef, ':scope > section:not(.services-masthead)')
  const [activeSection, setActiveSection] = useState<JourneyService | null>(null)
  const [showFloatingNav, setShowFloatingNav] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [meetingClosing, setMeetingClosing] = useState(false)
  const [selection, setSelection] = useState<QuoteSelection | null>(null)
  const modalReturnFocus = useRef<HTMLElement | null>(null)
  const openMeetingPoint = useCallback(() => { setMeetingClosing(false); setMeetingOpen(true) }, [])
  const closeMeetingPoint = useCallback(() => setMeetingClosing(true), [])

  useEffect(() => {
    let frame = 0
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const marker = Math.max(100, window.innerHeight * .3)
        const sections = serviceOptions.filter(([id]) => id !== 'custom')
        let current = sections[0]?.[0] ?? null
        for (const [id] of sections) {
          const section = document.getElementById('service-' + id)
          if (section && section.getBoundingClientRect().top <= marker) current = id
        }
        setActiveSection(current)
        const directory = document.querySelector('.services-masthead-nav')
        const quote = document.getElementById('service-custom')
        const headerHeight = window.matchMedia('(min-width: 1024px)').matches ? 76 : 72
        setShowFloatingNav(Boolean(directory && directory.getBoundingClientRect().bottom <= headerHeight && (!quote || quote.getBoundingClientRect().top > marker)))
      })
    }
    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [])

  useEffect(() => {
    if (!meetingOpen) return
    modalReturnFocus.current = document.activeElement as HTMLElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const modal = document.querySelector<HTMLElement>('.svc-modal')
    modal?.querySelector<HTMLButtonElement>('button')?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMeetingPoint()
      if (event.key === 'Tab') {
        const controls = modal?.querySelectorAll<HTMLElement>('button, a, input, [tabindex="0"]')
        if (!controls?.length) return
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', close)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', close); modalReturnFocus.current?.focus() }
  }, [closeMeetingPoint, meetingOpen])

  const scrollTo = (id: string) => {
    const section = document.getElementById('service-' + id)
    if (!section) return
    setActiveSection(id as JourneyService)
    const compactHeaderHeight = window.matchMedia('(min-width: 1024px)').matches ? 76 : 72
    const top = section.getBoundingClientRect().top + window.scrollY - compactHeaderHeight
    window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const requestJourney = (request: JourneyRequest) => setSelection(previous => ({ ...request, revision: (previous?.revision ?? 0) + 1 }))

  return <div ref={pageRef} className={`services-new-page services-experience${activeSection === 'hourly' ? ' is-hourly-active' : ''}${activeSection === 'water-taxi' ? ' is-water-taxi-active' : ''}${activeSection === 'europe' ? ' is-europe-active' : ''}`}>
    <section className="services-masthead" aria-labelledby="services-title">
      <OptimizedImage className="services-masthead-photo" src={publicAsset('images/services/water-taxi/venice-lagoon-water-taxi.jpg')} alt={t("Boat crossing the Venetian lagoon near Santa Maria della Salute")} width={2200} height={1650} fetchPriority="high" />
      <div className="services-masthead-shell">
        <div className="services-masthead-copy">
          <p className="services-masthead-eyebrow">{t("SERVICES & PRICES")}</p>
          <h1 id="services-title">{t("Private transfers from Venice and Treviso.")}</h1>
          <p className="services-masthead-description">{t("Airport pick-ups, Water Taxi connections, chauffeurs by the hour and longer routes across Italy and Europe.")}</p>
          <div className="services-masthead-actions">
            <button type="button" className="services-masthead-primary" onClick={() => scrollTo('airport')}>{t("EXPLORE SERVICES ↓")}</button>
          </div>
        </div>
      </div>
      <nav id="services-directory" className="services-masthead-nav services-top-navigation" aria-label={t("Choose a service")}>
        {serviceOptions.filter(([id]) => id !== 'custom').map(([id, label]) =>
          <button key={id} type="button" aria-current={activeSection === id ? 'location' : undefined}
            onClick={() => scrollTo(id)}>
            <span>{t(label)}</span>
          </button>)}
      </nav>
    </section>
    {showFloatingNav && <FloatingServiceNav activeSection={activeSection} onSelect={scrollTo} />}
    <AirportTransfers onMeetingPoint={openMeetingPoint} onRequest={requestJourney} />
    <HourlySection onRequest={requestJourney} />
    <WaterTaxiSection onRequest={requestJourney} />
    <EuropeSection onRequest={requestJourney} />
    <ProseccoHills onRequest={requestJourney} />
    <MountainsSection onRequest={requestJourney} />
    <SeasideSection onRequest={requestJourney} />
    <CruiseSection onRequest={requestJourney} />
    <PricingGuide navigate={navigate} />
    <ServiceQuoteForm selection={selection} />
    {meetingOpen && <div
      className={`svc-modal${meetingClosing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-title"
      aria-describedby="meeting-description"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeMeetingPoint() }}
      onAnimationEnd={(event) => { if (event.target === event.currentTarget && meetingClosing) setMeetingOpen(false) }}
    ><div className="svc-modal-panel svc-meeting-modal-panel">
      <button type="button" className="svc-modal-close" onClick={closeMeetingPoint} aria-label={t("Close meeting point guide")}><span aria-hidden="true">{"×"}</span></button>
      <div className="svc-meeting-modal-copy">
        <p className="svc-eyebrow">{t("Meeting point")}</p>
        <h2 id="meeting-title">{t("Where to meet your chauffeur")}</h2>
        <p id="meeting-description">{t("After collecting your luggage, follow the Arrivals signs. Your chauffeur will wait nearby holding a tablet with your name.")}</p>
      </div>
      <div className="svc-meeting-gallery">
        <figure>
          <div className="svc-meeting-photo"><OptimizedImage src={`${import.meta.env.BASE_URL}images/services/airport/venice-airport-arrivals.jpeg`} alt={t("Arrivals exit at Venice Marco Polo Airport")} /></div>
          <figcaption><span>{"01"}</span><strong>{t("Exit through Arrivals")}</strong></figcaption>
        </figure>
        <figure>
          <div className="svc-meeting-photo"><OptimizedImage src={`${import.meta.env.BASE_URL}images/services/airport/venice-airport-change.jpeg`} alt={t("Currency exchange counter marked Change inside Venice Marco Polo Airport")} /></div>
          <figcaption><span>{"02"}</span><strong>{t("Nearby reference point")}</strong><small>{t("Look for the CHANGE office.")}</small></figcaption>
        </figure>
      </div>
    </div></div>}

  </div>
}
