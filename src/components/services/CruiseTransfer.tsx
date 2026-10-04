import { message, t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useState } from 'react'
import { cruiseRoutes, priceLabel } from './serviceData'
import type { RequestJourney } from './ServiceRoutes'
import { publicAsset } from '../../lib/publicAsset'
import './cruise-transfer.css'

export default function CruiseTransfer({ onRequest }: { onRequest: RequestJourney }) {
  useLocale()
  const [routesOpen, setRoutesOpen] = useState(true)
  return <section id="service-cruise" className="ct-section" aria-labelledby="cruise-title">
    <div className="ct-shell">
      <div className="ct-intro">
        <div className="ct-copy">
          <p className="ct-eyebrow">{t("CRUISE PORT TRANSFERS")}</p>
          <h2 id="cruise-title">{t("Cruise terminal transfers, both ways.")}</h2>
          <p className="ct-description">{t("Travel between your hotel, airport or agreed pick-up point and the cruise terminals in Ravenna, Trieste or Fusina.")}</p>
        </div>
      </div>
      <figure className="ct-cruise-photo">
        <OptimizedImage src={publicAsset('images/services/cruise/cruise-port-transfer-ship.jpg')} alt={t("Cruise ship docked at port at sunset")} />
      </figure>
      <div className="ct-journey" role="group" aria-label={t("Cruise transfer details")}>
        <div className="ct-journey-detail"><span className="ct-route-label">{t("FROM")}</span><span className="ct-route-place">{t("Your hotel, airport or address")}</span></div>
        <div className="ct-journey-detail"><span className="ct-route-label">{t("TERMINALS")}</span><span className="ct-route-place">{t("Ravenna · Trieste · Fusina")}</span></div>
        <div className="ct-journey-detail"><span className="ct-route-label">{t("JOURNEY")}</span><span className="ct-route-place">{t("One way or return")}</span></div>
      </div>
      <div className="ct-prices">
        <div className="ct-prices-heading"><button type="button" className="ct-text-action" aria-expanded={routesOpen} aria-controls="cruise-route-prices" onClick={() => setRoutesOpen(current => !current)}>{t(routesOpen ? 'HIDE ROUTES' : 'VIEW ROUTES')} <span aria-hidden="true">{t(routesOpen ? '↑' : '↓')}</span></button></div>
        <div id="cruise-route-prices" hidden={!routesOpen}>
        <div className="sr-home-head" aria-hidden="true"><span>{t("Route")}</span><span>{t("Sedan")}</span><span>{t("Van")}</span><span>{t("Minibus 12")}</span><span>{t("Action")}</span></div>
        <ul className="ct-routes">
          {cruiseRoutes.map(route => <li className="ct-route" key={route.id}>
            <div className="ct-route-heading"><h3>{route.id === 'venice-fusina-cruise-terminal' ? <>{t(route.from)} <span aria-hidden="true">{"→"}</span> {t(" Fusina Cruise")}<br className="ct-terminal-break" /> {t(" Terminal")}</> : <>{t(route.from)} <span aria-hidden="true">{"→"}</span> {t(route.to)}</>}</h3></div>
            <dl className="ct-fares">
              <div><dt>{t("Sedan")}</dt><dd>{t(priceLabel(route.sedan))}</dd></div>
              <div><dt>{t("Van")}</dt><dd>{t(priceLabel(route.van))}</dd></div>
              <div><dt>{t("Minibus 12")}</dt><dd>{t(priceLabel(route.minibus))}</dd></div>
            </dl>
            <button type="button" className="ct-text-action ct-request" aria-label={message("Request this route: {0} to {1}", t(route.from), t(route.to))} onClick={() => onRequest({ service: 'cruise', pickup: route.pickup, destination: route.destination })}>{t("REQUEST THIS ROUTE ")}<span aria-hidden="true">{"→"}</span></button>
          </li>)}
        </ul>
        <div className="ct-footer">
          <p className="ct-fare-note">{t("One-way fares. Your final price is confirmed before booking.")}</p>
          <button type="button" className="ct-text-action" onClick={() => onRequest({ service: 'cruise' })}>{t("Request a different route ")}<span aria-hidden="true">{"→"}</span></button>
        </div>
        </div>
      </div>
    </div>
  </section>
}
