import { message, t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useState } from 'react'
import { mountainRoutes, priceLabel } from './serviceData'
import type { RequestJourney } from './ServiceRoutes'
import { publicAsset } from '../../lib/publicAsset'
import './mountains-transfer.css'

export default function MountainsTransfer({ onRequest }: { onRequest: RequestJourney }) {
  useLocale()
  const [routesOpen, setRoutesOpen] = useState(true)
  const [visibleCount, setVisibleCount] = useState(3)
  const requestRoute = (route: typeof mountainRoutes[number]) => onRequest({ service: 'mountains', pickup: route.pickup, destination: route.destination })

  return <section id="service-mountains" className="mt-section" aria-labelledby="mountains-title">
    <div className="mt-shell">
      <p className="mt-eyebrow">{t("PRIVATE MOUNTAIN TRANSFERS")}</p>
      <h2 id="mountains-title">{t("From the city to the")}<br className="mt-mobile-title-break" /> {t(" mountains.")}</h2>
      <OptimizedImage className="mt-panorama" src={publicAsset('images/services/venice-dolomites-transfer.png')} alt={t("Mercedes chauffeur vehicle between Venice and the Dolomite mountains")} width={2172} height={724} loading="lazy" decoding="async" />
      <div className="mt-information">
        <p className="mt-description">{t("Private transfers from Venice to Cortina d’Ampezzo, Corvara, Canazei and other Dolomites destinations.")}</p>
        <button type="button" className="mt-request mt-disclosure" aria-expanded={routesOpen} aria-controls="dolomites-route-prices" onClick={() => { setRoutesOpen(current => !current); setVisibleCount(3) }}>{t(routesOpen ? 'HIDE ROUTES & PRICES' : 'VIEW ROUTES & PRICES')} <span aria-hidden="true">{t(routesOpen ? '↑' : '↓')}</span></button>
      </div>
      <div id="dolomites-route-prices" className="mt-all-routes" data-open={routesOpen}>
        <table id="mountain-route-table" className="mt-table sr-home-table" aria-label={t("All mountain routes and prices")}>
          <thead><tr><th scope="col">{t("Route")}</th><th scope="col">{t("Sedan")}</th><th scope="col">{t("Van")}</th><th scope="col">{t("Minibus 12")}</th><th scope="col">{t("Action")}</th></tr></thead>
          <tbody>{mountainRoutes.slice(0, visibleCount).map(route => <tr key={route.id}>
            <th scope="row"><span className="sr-route-copy"><span className="sr-route-title">{t(route.from)} <span className="mt-arrow">{"→"}</span> {t(route.to)}</span></span></th>
            <td><span className="mt-mobile-label">{t("Sedan")}</span>{t(priceLabel(route.sedan))}</td><td><span className="mt-mobile-label">{t("Van")}</span>{t(priceLabel(route.van))}</td><td><span className="mt-mobile-label">{t("Minibus 12")}</span>{t(priceLabel(route.minibus))}</td>
            <td className="mt-action"><button type="button" className="mt-request" aria-label={message("Request this route: {0} to {1}", t(route.from), t(route.to))} onClick={() => requestRoute(route)}>{t("REQUEST THIS ROUTE ")}<span aria-hidden="true">{"→"}</span></button></td>
          </tr>)}</tbody>
        </table>
        <div className="mt-more-routes">
          {visibleCount < mountainRoutes.length && <button type="button" className="mt-request" aria-controls="mountain-route-table" onClick={() => setVisibleCount(current => Math.min(current + 3, mountainRoutes.length))}>{t("SHOW MORE ROUTES ")}<span aria-hidden="true">{"↓"}</span></button>}
          <p className="mt-disclaimer"><span className="mt-disclaimer-mark" aria-hidden="true">{"!"}</span><span>{t("Seasonal weather and road conditions may affect mountain access, journey times and fares. We’ll confirm current conditions and the final details before your trip.")}</span></p>
        </div>
      </div>
    </div>
  </section>
}
