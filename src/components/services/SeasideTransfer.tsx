import { message, t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useEffect, useState } from 'react'
import { coastalRoutes, priceLabel } from './serviceData'
import type { RequestJourney } from './ServiceRoutes'
import './seaside-transfer.css'

const featuredRoutes = [
  { ...coastalRoutes[0], to: 'Jesolo', minibusLabel: 'Minibus' },
  { id: 'marco-polo-bibione', from: 'Marco Polo', to: 'Bibione', pickup: 'Venice Marco Polo Airport (VCE)', destination: 'Bibione', airportMode: 'pickup' as const, sedan: 220, van: 250, minibus: 480, minibusLabel: 'Minibus' },
  { id: 'marco-polo-lignano-sabbiadoro', from: 'Marco Polo', to: 'Lignano Sabbiadoro', pickup: 'Venice Marco Polo Airport (VCE)', destination: 'Lignano Sabbiadoro', airportMode: 'pickup' as const, sedan: 220, van: 250, minibus: 480, minibusLabel: 'Minibus' },
]
const routes = [...featuredRoutes, ...coastalRoutes.filter(route => route.id !== featuredRoutes[0].id).map(route => ({ ...route, minibusLabel: 'Minibus' }))]
const fare = (amount: number | null) => amount === null ? '€—' : priceLabel(amount)
const tabletViewportQuery = '(min-width: 768px) and (max-width: 1100px)'

export default function SeasideTransfer({ onRequest }: { onRequest: RequestJourney }) {
  useLocale()
  const [isTablet, setIsTablet] = useState(() => typeof window !== 'undefined' && window.matchMedia(tabletViewportQuery).matches)
  const [extraVisible, setExtraVisible] = useState(0)
  const visibleCount = Math.min((isTablet ? 4 : 3) + extraVisible, routes.length)

  useEffect(() => {
    const tabletViewport = window.matchMedia(tabletViewportQuery)
    const updateViewport = () => setIsTablet(tabletViewport.matches)
    updateViewport()
    tabletViewport.addEventListener('change', updateViewport)
    return () => tabletViewport.removeEventListener('change', updateViewport)
  }, [])

  return <section id="service-coast" className="cs-section" aria-labelledby="coast-title">
    <div className="cs-shell">
      <div className="cs-intro">
        <div className="cs-copy">
          <p className="cs-eyebrow">{t("PRIVATE SEASIDE TRANSFERS")}</p>
          <h2 id="coast-title">{t("From Venice, straight to the coast.")}</h2>
          <p className="cs-description">{t("Private transfers from Venice or Marco Polo Airport to Jesolo, Bibione, Caorle and other Adriatic seaside destinations.")}</p>
        </div>
        <div className="cs-visual"><div className="cs-panorama"><OptimizedImage src={publicAsset('images/services/seaside/adriatic-coast.jpg')} alt={t("Adriatic seaside town overlooking the sea")} loading="lazy" /></div></div>
      </div>
      <div id="coast-route-prices" className="cs-all-routes">
        <ol id="coast-route-list" className="cs-route-grid">
          {routes.slice(0, visibleCount).map((route, index) => <li className="cs-route" key={route.id}>
            <span className="cs-number" aria-hidden="true">{t(String(index + 1).padStart(2, '0'))}</span>
            <h3 className={[`${route.from} ${route.to}`.length > 27 && 'cs-long-route', route.id === 'marco-polo-lignano-sabbiadoro' && 'cs-nowrap-route'].filter(Boolean).join(' ')}><span className="cs-origin">{t(route.from)} <span className="cs-arrow">{"→"}</span></span> <span className="cs-destination">{route.id === 'marco-polo-lignano-sabbiadoro' ? <>{t("Lignano")}<br className="cs-mobile-route-break" /> {t(" Sabbiadoro")}</> : route.to}</span></h3>
            <dl className="cs-fares"><div><dt>{t("Sedan")}</dt><dd>{t(fare(route.sedan))}</dd></div><div><dt>{t("Van")}</dt><dd>{t(fare(route.van))}</dd></div><div><dt>{t(route.minibusLabel)}</dt><dd>{t(fare(route.minibus))}</dd></div></dl>
            <button type="button" className="cs-route-request" aria-label={message("Request this route: {0} to {1}", t(route.from), t(route.to))} onClick={() => onRequest({ service: 'coast', pickup: route.pickup, destination: route.destination, airportPickup: route.airportMode === 'pickup' })}>{t("REQUEST THIS ROUTE ")}<span aria-hidden="true">{"→"}</span></button>
          </li>)}
        </ol>
        <div className="cs-footer"><p>{t("One-way fares. Final price confirmed before booking.")}</p>
        {visibleCount < routes.length && <div className="cs-more-routes">
          <button type="button" className="cs-route-request" aria-controls="coast-route-list" onClick={() => setExtraVisible(current => current + 3)}>{t("VIEW MORE SEASIDE ROUTES ")}<span aria-hidden="true">{"↓"}</span></button>
        </div>}
        </div>
      </div>
    </div>
  </section>
}
import { publicAsset } from '../../lib/publicAsset'
