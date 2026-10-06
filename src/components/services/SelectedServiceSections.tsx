import { getLanguage, message, t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useEffect, useState } from 'react'
import { ArrowRight, Briefcase, Buildings, CarProfile, ForkKnife, ShoppingBag } from '@phosphor-icons/react'
import { italyRoutes, priceLabel } from './serviceData'
import { ServiceTabs, type RequestJourney } from './ServiceRoutes'
import './water-taxi-map.css'
import './europe-transfer.css'
import { imageAttributes, publicAsset } from '../../lib/publicAsset'

const crossBorderRoutes = [
  { id: 'italy-austria', from: 'Italy', to: 'Austria', pickup: 'Italy', destination: 'Austria', sedan: 850, van: 980, minibus: 1700 },
  { id: 'italy-slovenia', from: 'Italy', to: 'Slovenia', pickup: 'Italy', destination: 'Slovenia', sedan: 720, van: 840, minibus: 1450 },
  { id: 'italy-croatia', from: 'Italy', to: 'Croatia', pickup: 'Italy', destination: 'Croatia', sedan: 980, van: 1150, minibus: 1950 },
  { id: 'italy-france', from: 'Italy', to: 'France', pickup: 'Italy', destination: 'France', sedan: 1250, van: 1450, minibus: 2400 },
]

export function HourlySection({ onRequest }: { onRequest: RequestJourney }) {
  useLocale()
  return <section id="service-hourly" className="sv-section sv-hourly sv-hourly-mockup" aria-labelledby="hourly-title">
    <div className="svc-shell hourly-mockup-shell">
      <div className="hourly-mockup-visual">
        <div className="hourly-mockup-frame"><OptimizedImage src={publicAsset('images/services/hourly/several-stops-chauffeur-panorama.jpg')} alt={t("Chauffeur welcoming a passenger into a private vehicle")} loading="lazy" /></div>
        <h2 id="hourly-title">{t("Several stops.")}<br />{t("One chauffeur.")}</h2>
      </div>

      <div className="hourly-mockup-content">
        <p className="hourly-mockup-description">{t("Book a chauffeur for two hours or a full day. Agree your stops in advance; your driver waits between them.")}</p>

        <div className="hourly-mockup-route-wrap">
          <div className="hourly-mockup-route-scroll">
            <div className="hourly-mockup-route" aria-label={t("Hotel, meeting, lunch, shopping")}>
              <div><Buildings size={21} weight="thin" aria-hidden="true" /><span>{t("Hotel")}</span></div>
              <i aria-hidden="true"><ArrowRight size={15} weight="light" /></i>
              <div><Briefcase size={21} weight="thin" aria-hidden="true" /><span>{t("Meeting")}</span></div>
              <i aria-hidden="true"><ArrowRight size={15} weight="light" /></i>
              <div><ForkKnife size={21} weight="thin" aria-hidden="true" /><span>{t("Lunch")}</span></div>
              <i aria-hidden="true"><ArrowRight size={15} weight="light" /></i>
              <div><ShoppingBag size={21} weight="thin" aria-hidden="true" /><span>{t("Shopping")}</span></div>
            </div>
          </div>
          <div className="hourly-mockup-details">
            <strong>{t("Minimum booking: 2 hours")}</strong>
            <p>{t("Price based on time, route and requested stops.")}</p>
          </div>
        </div>

        <button type="button" className="hourly-mockup-cta" onClick={() => onRequest({ service: 'hourly' })}>{t("Request an hourly quote ")}<ArrowRight size={18} weight="light" aria-hidden="true" /></button>
      </div>
    </div>
  </section>
}

const getWaterTaxiJourneys = () => [
  {
    route: 'Route to Venice',
    image: publicAsset(getLanguage() === 'ru' ? 'images/services/water-taxi/venice-water-taxi-arrival-route-ru.webp' : 'images/services/water-taxi/arriving-wide-map.png'),
    mobileImage: publicAsset(getLanguage() === 'ru' ? 'images/services/water-taxi/venice-water-taxi-arrival-route-mobile-ru.webp' : 'images/services/water-taxi/arriving-mobile-map-v2.jpg'),
    alt: 'Venice transfer map showing Marco Polo Airport, Piazzale Roma and the hotel or nearest landing, connected by private car and water taxi.',
    title: <>{t("From the airport to your")}<br /><span>{t("hotel in Venice.")}</span></>,
    description: 'We meet you at Marco Polo Airport and drive you to Piazzale Roma. From there, a private water taxi takes you to your hotel or the nearest accessible landing.',
    note: 'Direct hotel access depends on the canal and the available landing point.',
  },
  {
    route: 'Route from Venice',
    image: publicAsset(getLanguage() === 'ru' ? 'images/services/water-taxi/venice-water-taxi-departure-route-ru.webp' : 'images/services/water-taxi/leaving-wide-map.png'),
    mobileImage: publicAsset(getLanguage() === 'ru' ? 'images/services/water-taxi/venice-water-taxi-departure-route-mobile-ru.webp' : 'images/services/water-taxi/leaving-mobile-map-v2.jpg'),
    alt: 'Departure map from a Venice hotel or nearest landing by private water taxi to Piazzale Roma, then by private car to Marco Polo Airport.',
    title: <>{t("From your hotel in")}<br className="wt-mobile-title-break" />{' '}{t("Venice")}<br className="wt-desktop-title-break" />{' '}<span>{t("to the airport.")}</span></>,
    description: 'A private water taxi collects you at your hotel or the nearest accessible landing and takes you to Piazzale Roma. From there, your chauffeur drives you to Marco Polo Airport.',
    note: 'Your exact pick-up point depends on the canal and available landing. We confirm it before departure.',
  },
] as const

export function WaterTaxiSection({ onRequest }: { onRequest: RequestJourney }) {
  useLocale()
  const waterTaxiJourneys = getWaterTaxiJourneys()
  const [direction, setDirection] = useState(0)
  const journey = waterTaxiJourneys[direction]

  useEffect(() => {
    const section = document.getElementById('service-water-taxi')
    if (!section || !('IntersectionObserver' in window)) return

    section.classList.add('wt-mobile-reveal-ready')
    const observer = new IntersectionObserver(([entry]) => {
      section.classList.toggle('wt-mobile-in-view', entry.isIntersecting)
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' })
    observer.observe(section)

    return () => {
      observer.disconnect()
      section.classList.remove('wt-mobile-reveal-ready', 'wt-mobile-in-view')
    }
  }, [])

  const changeDirection = (next: number) => {
    if (next === direction) return
    setDirection(next)
  }

  return <section id="service-water-taxi" className="wt-map-section" aria-labelledby="water-title">
    <svg className="wt-image-filter" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="wt-map-transparency" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  2.1 2.9 2.2 0 -0.8" />
        </filter>
      </defs>
    </svg>
    <div className="svc-shell wt-shell">
      <div className={`wt-hero ${direction === 0 ? 'wt-arriving' : 'wt-leaving'}`}>
        <div className="wt-visual-column">
          <div className="wt-hero-maps">
            {waterTaxiJourneys.map((item, index) => <div key={item.route} className={`wt-map-frame wt-map-layer${direction === index ? ' is-active' : ''}`} role="tabpanel" id={`water-panel-${index}`} aria-labelledby={`water-tab-${index}`} aria-hidden={direction !== index} inert={direction !== index} tabIndex={direction === index ? 0 : -1}>
              <picture>
                <source media="(max-width: 1023px)" srcSet={imageAttributes(item.mobileImage).srcSet ?? item.mobileImage} sizes="(max-width: 767px) calc(100vw - 48px), 620px" />
                <OptimizedImage src={item.image} alt={t(item.alt)} sizes="(max-width: 1023px) 620px, (max-width: 1536px) 90vw, 1340px" loading="eager" decoding="async" />
              </picture>
            </div>)}
          </div>

        </div>
        <div className="wt-hero-copy">
          <header className="wt-heading">
            <p className="wt-nav-eyebrow">{t("WATER TAXI")}</p>
          <h2 id="water-title" className={direction === 1 ? 'wt-leaving-title' : undefined}>{t(journey.title)}</h2>
            <div className="wt-description-slot">
              {waterTaxiJourneys.map((item, index) => <p key={item.route} className={`wt-description${direction === index ? ' is-active' : ''}`} aria-hidden={direction !== index}>{t(item.description)}</p>)}
            </div>
          </header>

          <ServiceTabs id="water" labels={['Arriving in Venice', 'Leaving Venice']} mobileLabels={['Arriving', 'Leaving']} selected={direction} onChange={changeDirection} />
        </div>
          <footer className="wt-booking">
            <div className="wt-access-notes">
              {waterTaxiJourneys.map((item, index) => <p key={item.route} className={`wt-access-note${direction === index ? ' is-active' : ''}`} aria-hidden={direction !== index}>
                {item.route === 'Route to Venice' ? <>{t("Direct hotel access depends on the canal")}<br className="wt-desktop-note-break" /> {t(" and the available landing point.")}</> : item.note}
              </p>)}
            </div>
            <div className="wt-price-block">
              <div className="wt-fare"><span>{t("Private car")}</span><strong><span className="wt-price-prefix">{t("from ")}</span>{"€80"}</strong></div>
              <div className="wt-fare"><span>{t("Water taxi")}</span><strong>{"€100–140"}<span className="wt-estimated"> {t(" estimated")}</span></strong></div>
            </div>
            <button type="button" className="wt-cta" onClick={() => onRequest({ service: 'water-taxi', airportPickup: direction === 0 })}>{t("REQUEST THIS TRANSFER")}<ArrowRight size={18} weight="light" aria-hidden="true" /></button>
          </footer>
      </div>
    </div>
  </section>
}

function EuropeRouteTable({ routes, region, onRequest }: { routes: typeof italyRoutes; region: string; onRequest: RequestJourney }) {
  useLocale()
  const [showAll, setShowAll] = useState(false)
  return <>
    <table className="et-table sr-home-table" id={`et-${region}-routes`} aria-label={message("{0} routes and prices", t(region))}>
      <thead><tr><th scope="col">{t("Route")}</th><th scope="col">{t("Sedan")}</th><th scope="col">{t("Van")}</th><th scope="col">{t("Minibus 12")}</th><th scope="col">{t("Action")}</th></tr></thead>
      <tbody>{(showAll ? routes : routes.slice(0, 3)).map(route => <tr key={route.id}>
        <th scope="row"><span className="sr-route-copy"><span className="sr-route-title">{t(route.from)} <span className="et-arrow">{"→"}</span> {t(route.to)}</span></span></th>
        <td><span className="et-mobile-label">{t("Sedan")}</span>{t(priceLabel(route.sedan))}</td>
        <td><span className="et-mobile-label">{t("Van")}</span>{t(priceLabel(route.van))}</td>
        <td><span className="et-mobile-label">{t("Minibus 12")}</span>{t(priceLabel(route.minibus))}</td>
        <td className="et-action"><button type="button" className="et-button" aria-label={message("Request this route: {0} to {1}", t(route.from), t(route.to))} onClick={() => onRequest({ service: 'europe', pickup: route.pickup, destination: route.destination })}>{t("REQUEST THIS ROUTE ")}<span aria-hidden="true">{"→"}</span></button></td>
      </tr>)}</tbody>
    </table>
    <div className="et-footer">
      <div className="et-footer-copy">
        <p className="et-fare-note">{t(region === 'Italy' ? 'One-way fares from Venice. Final prices depend on route, vehicle and availability.' : 'Indicative fares from Italy. Final prices depend on the route, vehicle, availability and extras.')} <button type="button" className="et-button et-destination-button" onClick={() => onRequest({ service: 'europe' })}><span className="et-desktop-copy">{t("Request a different destination")}</span><span className="et-mobile-copy">{t("Different destination?")}</span><span className="et-destination-arrow" aria-hidden="true">{"→"}</span></button></p>
      </div>
      <div className="et-footer-actions">
        {routes.length > 3 && <button type="button" className="et-button et-view-all" aria-expanded={showAll} aria-controls={`et-${region}-routes`} onClick={() => setShowAll(current => !current)}>{t(showAll ? 'Show fewer routes' : message("View all {0} routes", t(region)))} <span aria-hidden="true">{t(showAll ? '↑' : '↓')}</span></button>}
      </div>
    </div>
  </>
}

export function EuropeSection({ onRequest, fareRequest = 0 }: { onRequest: RequestJourney; fareRequest?: number }) {
  useLocale()
  const [region, setRegion] = useState(0)
  const [routesOpen, setRoutesOpen] = useState(false)

  useEffect(() => {
    if (!fareRequest) return
    setRoutesOpen(true)
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('italy-route-prices')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [fareRequest])

  return <section id="service-europe" className="et-section" aria-labelledby="europe-title">
    <div className="et-intro">
      <div className="et-photo"><OptimizedImage src={publicAsset('images/services/europe/italy-europe-chauffeur.jpg')} alt={t("Chauffeur welcoming a passenger into a private vehicle")} loading="lazy" /></div>
      <div className="et-copy">
        <p className="et-eyebrow">{t("PRIVATE JOURNEYS · ITALY & EUROPE")}</p>
        <h2 id="europe-title">{t("Private transfers across Italy")}<br className="services-tablet-title-break" />{' '}{t("and into Europe.")}</h2>
        <p className="et-description">{t("Travel from Venice or Treviso to another city in Italy or across the border.")}</p>
        <p className="et-countries">{t("ITALY ")}<i className="et-country-separator" aria-hidden="true">{"·"}</i> {t(" AUSTRIA ")}<i className="et-country-separator" aria-hidden="true">{"·"}</i> {t(" SLOVENIA ")}<i className="et-country-separator" aria-hidden="true">{"·"}</i> {t(" CROATIA ")}<i className="et-country-separator" aria-hidden="true">{"·"}</i> {t(" FRANCE")}</p>
        <div className="et-line" aria-hidden="true" />
        <button type="button" className="et-plan-link" onClick={() => onRequest({ service: 'europe' })}>{t("PLAN YOUR JOURNEY ")}<span aria-hidden="true">{"→"}</span></button>
        <button type="button" className="et-button et-disclosure" aria-expanded={routesOpen} aria-controls="italy-route-prices" onClick={() => setRoutesOpen(current => !current)}>{t(routesOpen ? 'HIDE ROUTES & PRICES' : 'SEE ROUTES & PRICES')} <span aria-hidden="true">{t(routesOpen ? '↑' : '↓')}</span></button>
      </div>
    </div>
    <div id="italy-route-prices" className="et-panel" data-open={routesOpen}>
      <div className="et-panel-inner">
        <ServiceTabs id="regions" labels={['Italy', 'Europe']} selected={region} onChange={setRegion} />
        <div role="tabpanel" id="regions-panel-0" aria-labelledby="regions-tab-0" hidden={region !== 0} tabIndex={0}>
          <EuropeRouteTable routes={italyRoutes} region="Italy" onRequest={onRequest} />
        </div>
        <div role="tabpanel" id="regions-panel-1" aria-labelledby="regions-tab-1" hidden={region !== 1} tabIndex={0}>
          <EuropeRouteTable routes={crossBorderRoutes} region="Europe" onRequest={onRequest} />
        </div>
      </div>
    </div>
  </section>
}

export { default as MountainsSection } from './MountainsTransfer'

export { default as SeasideSection } from './SeasideTransfer'

export { default as CruiseSection } from './CruiseTransfer'
