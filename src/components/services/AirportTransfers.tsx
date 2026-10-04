import { t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useState } from 'react'
import type { RequestJourney } from './ServiceRoutes'
import './airport-transfers.css'
import './airport-concierge.css'
import { publicAsset } from '../../lib/publicAsset'

const getJourneys = () => [
  {
    label: 'From the airport', title: <>{t("Airport pick-ups at")}<br /><span className="ac-title-second-line">{t("Marco Polo and Treviso.")}</span></>,
    description: 'We track your flight and adjust the pick-up time if needed. Your driver will meet you at the agreed point, help with your luggage and take you directly to your destination.',
    cta: 'REQUEST YOUR TRANSFER',
    features: ['Flight tracking', 'Meet & greet', 'Luggage assistance'],
    image: publicAsset('images/services/airport/journeys/from-the-airport.jpg'),
    imageAlt: 'Arrivals sign inside the airport terminal',
  },
  {
    label: 'To the airport', title: 'To the airport, on time.',
    description: 'We plan your pick-up around your departure time, terminal and traffic. Your chauffeur meets you at your address, helps with your luggage and takes you directly to the right terminal.',
    cta: 'REQUEST YOUR TRANSFER',
    features: ['Planned pick-up', 'Direct transfer', 'Luggage assistance'],
    image: publicAsset('images/services/airport/journeys/to-the-airport.jpg'),
    imageAlt: 'Departures sign inside the airport terminal',
  },
  {
    label: 'Address to address', title: 'Direct transfers between addresses.',
    description: 'Travel between hotels, stations and other road-accessible addresses. We confirm the pick-up point and luggage space in advance.',
    cta: 'REQUEST YOUR TRANSFER',
    features: ['Private journey', 'Flexible pick-up', 'Space for luggage'],
    image: publicAsset('images/services/airport/journeys/address-to-address.jpg'),
    imageAlt: 'Chauffeur loading luggage into a private vehicle',
  },
]

export default function AirportTransfers({ onMeetingPoint, onRequest }: { onMeetingPoint: () => void; onRequest: RequestJourney }) {
  useLocale()
  const journeys = getJourneys()
  const [selected, setSelected] = useState(0)
  const journey = journeys[selected]

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
            aria-controls="ac-journey"
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
          <div className="ac-copy ac-fade" key={`copy-${selected}`} id="ac-journey" role="tabpanel" aria-labelledby={`ac-tab-${selected}`} tabIndex={0}>
            <span className="ac-eyebrow">{t("PRIVATE TRANSFER")}</span>
            <h2 id="airport-transfers-title" className={selected === 2 ? 'ac-long-title' : selected === 0 ? 'ac-airport-title' : undefined}>
              <span>{t(journey.title)}</span>
            </h2>
            <p>{t(journey.description)}</p>
          </div>

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
