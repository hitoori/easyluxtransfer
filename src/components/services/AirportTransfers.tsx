import { t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useEffect, useState } from 'react'
import PageLink, { type Navigate } from '../PageLink'
import type { RequestJourney } from './ServiceRoutes'
import './airport-transfers.css'
import './airport-concierge.css'
import { publicAsset } from '../../lib/publicAsset'

const getJourneys = () => [
  {
    label: 'From the airport', title: <>{t("Airport pick-ups at")}<br className="ac-default-title-break" />{' '}<span className="ac-title-second-line">{t("Marco Polo")}<br className="services-tablet-title-break" />{' '}{t("and Treviso.")}</span></>,
    description: 'Private transfers from Venice Marco Polo Airport (VCE) or Treviso Airport (TSF) to Venice, Mestre, Treviso or your chosen destination. We track your flight, meet you in Arrivals after baggage claim and send exact meeting instructions before you travel.',
    guide: ['Airport meeting instructions', 'meeting'],
    cta: 'REQUEST YOUR TRANSFER',
    features: ['Flight tracking', 'Meet & greet', 'Luggage assistance'],
    image: publicAsset('images/services/airport/journeys/from-the-airport.jpg'),
    imageAlt: 'Arrivals sign inside the airport terminal',
  },
  {
    label: 'To the airport', title: 'To the airport, on time.',
    description: 'Travel from your agreed address or meeting point in Venice, Mestre or Treviso to Marco Polo or Treviso Airport. We plan your pick-up around your flight, terminal and traffic, and help with your luggage.',
    guide: ['Planning a return transfer', 'return'],
    cta: 'REQUEST YOUR TRANSFER',
    features: ['Planned pick-up', 'Direct transfer', 'Luggage assistance'],
    image: publicAsset('images/services/airport/journeys/to-the-airport.jpg'),
    imageAlt: 'Departures sign inside the airport terminal',
  },
  {
    label: 'Address to address', title: <>{t("Direct transfers between")}<br className="services-tablet-title-break" />{' '}{t("addresses.")}</>,
    description: 'Book a private transfer between Venice, Mestre, Treviso and your chosen destination. Your driver can collect you at a train station or another road-accessible address. Send both addresses, your preferred time and luggage details so we can confirm the meeting point and a suitable vehicle.',
    guide: ['Pick-up points and road access in Venice', 'venice-pickup'],
    cta: 'REQUEST YOUR TRANSFER',
    features: ['Private journey', 'Flexible pick-up', 'Space for luggage'],
    image: publicAsset('images/services/airport/journeys/address-to-address.jpg'),
    imageAlt: 'Chauffeur loading luggage into a private vehicle',
  },
]

export default function AirportTransfers({ onMeetingPoint, onRequest, navigate }: { onMeetingPoint: () => void; onRequest: RequestJourney; navigate: Navigate }) {
  useLocale()
  const journeys = getJourneys()
  const [selected, setSelected] = useState(0)
  const journey = journeys[selected]

  useEffect(() => {
    const followTabLink = () => {
      const match = /^#ac-tab-([012])$/.exec(window.location.hash)
      if (match) setSelected(Number(match[1]))
    }
    followTabLink()
    window.addEventListener('hashchange', followTabLink)
    window.addEventListener('popstate', followTabLink)
    return () => {
      window.removeEventListener('hashchange', followTabLink)
      window.removeEventListener('popstate', followTabLink)
    }
  }, [])

  const selectJourney = (next: number) => {
    setSelected(next)
    window.requestAnimationFrame(() => document.getElementById(`ac-tab-${next}`)?.focus())
  }

  return <section id="service-airport" className="airport-transfers airport-concierge" aria-labelledby="airport-transfers-title">
    <div className="svc-shell ac-shell">
      <div className="ac-stage">
        <div className="ac-tabs" role="tablist" aria-label={t("Choose your transfer")} aria-orientation="horizontal">
          {journeys.map(({ label }, index) => <button
            key={label}
            type="button"
            role="tab"
            id={`ac-tab-${index}`}
            aria-controls={`ac-journey-${index}`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={event => {
              const next = event.key === 'ArrowRight' ? (index + 1) % journeys.length : event.key === 'ArrowLeft' ? (index + journeys.length - 1) % journeys.length : event.key === 'Home' ? 0 : event.key === 'End' ? journeys.length - 1 : null
              if (next !== null) { event.preventDefault(); selectJourney(next) }
            }}
          >
            {t(label)}
          </button>)}
        </div>

        <div className={`ac-visual ac-visual--${['arrival', 'departure', 'address'][selected]}`}>
          <div className="ac-image-frame">
            <OptimizedImage key={journey.image} className="ac-image-main ac-fade" src={journey.image} alt={t(journey.imageAlt)} loading="lazy" />
          </div>
        </div>

        <div className="ac-content">
          {journeys.map((item, index) => <div className="ac-copy ac-fade" key={item.label} id={`ac-journey-${index}`} role="tabpanel" aria-labelledby={`ac-tab-${index}`} hidden={selected !== index} tabIndex={0}>
            <span className="ac-eyebrow">{t("PRIVATE TRANSFER")}</span>
            <h2 id={selected === index ? 'airport-transfers-title' : `airport-transfers-title-${index}`} className={index === 2 ? 'ac-long-title' : index === 0 ? 'ac-airport-title' : undefined}>
              <span>{t(item.title)}</span>
            </h2>
            <p>{t(item.description)}</p>
            <PageLink className="ac-guide-link" page="faq" sectionId={`fq-question-${item.guide[1]}`} navigate={navigate}>{t(item.guide[0])}<span aria-hidden="true">{" →"}</span></PageLink>
          </div>)}

          <ul className="ac-features ac-fade" key={`features-${selected}`} aria-label={t("Transfer features")}>
            {journey.features.map(feature => <li key={feature}>{t(feature)}</li>)}
          </ul>

          <div className="ac-booking">
            {selected === 0 && <div className="ac-meeting">
              <button type="button" onClick={onMeetingPoint}>{t("View meeting point →")}</button>
            </div>}
            <div className="ac-booking-row">
              <div className="ac-price">
                <span>{t("From")}</span>
                <strong>{"€80"}</strong>
              </div>
              <button className="sv-button" type="button" onClick={() => onRequest({ service: 'airport', airportPickup: selected === 0 })}>{t(journey.cta)}<span aria-hidden="true">{"→"}</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
}
