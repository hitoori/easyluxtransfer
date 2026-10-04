import { t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { prepareImage, useCarousel } from '../../hooks/useCarousel'
import { useRef, useState } from 'react'
import type { BookingPrefill } from '../BookingForm'
import { publicAsset } from '../../lib/publicAsset'

const destinations = [
  {
    id: 'prosecco', label: 'Prosecco Hills',
    image: publicAsset('images/home/private-journeys/prosecco-hills.jpg'),
    alt: 'Terraced vineyards and houses in the Prosecco Hills at golden hour',
    stops: ['Venice', 'Conegliano', 'Valdobbiadene'],
    destination: 'Valdobbiadene, Prosecco Hills',
    journey: 'Private chauffeur · Waiting by agreement · Return on request',
  },
  {
    id: 'dolomites', label: 'Dolomites',
    image: publicAsset('images/home/private-journeys/dolomites-mountain-landscape.jpg'),
    alt: 'Mountain landscape in the Dolomites',
    stops: ['Venice', 'Cortina d’Ampezzo'],
    destination: 'Cortina d’Ampezzo',
    journey: 'Private transfer to your hotel or meeting point. Stops, waiting and return pick-up can be arranged in advance.',
  },
  {
    id: 'coast', label: 'Coast & seaside',
    image: publicAsset('images/home/private-journeys/adriatic-coast-beach-aerial.jpg'),
    alt: 'Italian coastal landscape overlooking the sea',
    stops: ['Venice', 'Your seaside destination'],
    destination: 'Seaside destination — to be confirmed',
    journey: 'Private transfer to your chosen seaside address or hotel, one-way or with a return pick-up.',
  },
  {
    id: 'cruise', label: 'Cruise terminals',
    image: publicAsset('images/home/private-journeys/cruise-ship-at-terminal.jpg'),
    alt: 'Cruise ship at port at dusk',
    stops: ['Venice', 'Your cruise terminal'],
    destination: 'Cruise terminal — to be confirmed',
    journey: 'Private chauffeur to or from your confirmed cruise terminal, planned around your ship and boarding time.',
  },
]

interface PrivateJourneysProps {
  onBookRoute: (route: Omit<BookingPrefill, 'requestId'>) => void
}

const prepareJourney = (index: number) => prepareImage(destinations[index].image, '(max-width: 760px) 100vw, 80vw')

export default function PrivateJourneys({ onBookRoute }: PrivateJourneysProps) {
  useLocale()
  const [selectedJourneyIndex, setSelectedJourneyIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const carousel = useCarousel(destinations.length, 8000, sectionRef, prepareJourney)
  const selected = destinations[selectedJourneyIndex]
  const photo = destinations[carousel.activeIndex]
  const selectJourney = (index: number) => {
    setSelectedJourneyIndex(index)
    void carousel.select(index)
  }

  return (
    <section ref={sectionRef} {...carousel.interactionProps} data-home-prosecco className="private-journeys home-flow-section" aria-labelledby="private-journeys-title">
      <div className="private-journeys-layout">
        <div className="private-journeys-copy">
          <p className="private-journeys-kicker">{t("Private journeys")}</p>
          <h2 id="private-journeys-title">{t("Journeys from Venice.")}</h2>
          <p className="private-journeys-intro">{t("Travel to the Prosecco Hills, Dolomites, coast or cruise terminals. Stops and return pick-up can be arranged in advance.")}</p>
        </div>

        <div className="private-journeys-tabs" role="tablist" aria-label={t("Private journey destinations")}>
          {destinations.map((destination, index) => (
            <button
              key={destination.id} id={`journey-tab-${destination.id}`} type="button" role="tab"
              aria-selected={index === selectedJourneyIndex} aria-controls="private-journey-panel"
              className={index === selectedJourneyIndex ? 'is-selected' : undefined}
              tabIndex={index === selectedJourneyIndex ? 0 : -1}
              onClick={() => selectJourney(index)}
              onKeyDown={(event) => {
                let next = index
                if (event.key === 'ArrowRight') next = (index + 1) % destinations.length
                else if (event.key === 'ArrowLeft') next = (index + destinations.length - 1) % destinations.length
                else if (event.key === 'Home') next = 0
                else if (event.key === 'End') next = destinations.length - 1
                else return
                event.preventDefault()
                selectJourney(next)
                document.getElementById(`journey-tab-${destinations[next].id}`)?.focus()
              }}
            >
              <span aria-hidden="true">{t(String(index + 1).padStart(2, '0'))}</span>{t(destination.label)}
            </button>
          ))}
        </div>

          <div id="private-journey-panel" className="private-journeys-visual" role="tabpanel" aria-labelledby={`journey-tab-${selected.id}`} tabIndex={0}>
            <div className="private-journeys-photo">
              {carousel.previousIndex !== null && <OptimizedImage key={`out-${destinations[carousel.previousIndex].id}`} className="is-outgoing" src={destinations[carousel.previousIndex].image} alt={""} aria-hidden="true" decoding="async" />}
              <OptimizedImage key={`in-${photo.id}`} className="is-current" src={photo.image} alt={t(photo.alt)} loading="lazy" sizes="(max-width: 760px) 100vw, 80vw" decoding="async" />
              <span className="private-journeys-photo-caption">{t(photo.label)}</span>
            </div>
          <div className="private-journeys-route" aria-live="polite">
            <div className="private-journeys-stops">
              <small>{t("Route")}</small>
              <p className="private-journeys-desktop-route">{selected.stops.map((stop, index) => <span key={stop}>{index > 0 && <span className="private-journeys-route-arrow" aria-hidden="true">{"→"}</span>}{t(stop)}</span>)}</p>
              <p className="private-journeys-mobile-route">{t("Venice ")}<span aria-hidden="true">{"→"}</span> {t(selected.label)}</p>
            </div>
            <div className="private-journeys-terms">
              <small>{t("Journey")}</small>
              <p className="private-journeys-desktop-terms">{t(selected.journey)}</p>
              <p className="private-journeys-mobile-terms">{t("Private car ")}<span>{"·"}</span> {t(" Waiting time ")}<span>{"·"}</span> {t(" Return journey")}</p>
            </div>
            <button className="private-journeys-plan" type="button" onClick={() => onBookRoute({ pickup: 'Venice', destination: selected.destination, airportMode: 'none' })}>
              {t("Plan this journey ")}<span aria-hidden="true">{"→"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
