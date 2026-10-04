import { t, useLocale } from '../i18n/locale'
import OptimizedImage from './OptimizedImage'
import {
  ArrowRight,
  Boat,
} from '@phosphor-icons/react'
import { publicAsset } from '../lib/publicAsset'

interface VeniceArrivalFeatureProps {
  onPlanJourney: () => void
}

export default function VeniceArrivalFeature({ onPlanJourney }: VeniceArrivalFeatureProps) {
  useLocale()
  return (
    <section data-home-arrival className="water-route-section home-flow-section">
      <OptimizedImage
        src={publicAsset('images/home/water-taxi/venice-water-taxi.jpg')}
        alt={""}
        aria-hidden="true"
        className="water-route-background"
      />
      <div className="water-route-background-shade" aria-hidden="true" />

      <div className="water-route-inner">
        <div className="water-route-copy">
          <p className="water-route-kicker">{t("Venice Water Taxi")}</p>
          <h2><span>{t("Water Taxi and private")}</span>{' '}<span>{t("car, arranged together.")}</span></h2>
          <div className="water-route-description">
            <p>{t("We arrange a Water Taxi between your Venice address and Piazzale Roma, where a private driver continues your journey. The same service is available in reverse.")}</p>
            <p>{t("We’ll send your boarding point and boat number the day before travel.")}</p>
          </div>

          <div className="water-route-rates">
            <div>
              <p>{t("Private car")}</p>
              <strong>{t("from €80")}</strong>
            </div>
            <div>
              <p>{t("Water taxi")}</p>
              <strong className="water-route-gold-rate">{"€100–140 "}<span>{t("estimated")}</span></strong>
            </div>
          </div>

          <button type="button" onClick={onPlanJourney} className="water-route-cta">
            {t("Plan your connection")}<ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="water-route-visual">
        <OptimizedImage src={publicAsset('images/home/water-taxi/route-map.png')} alt={""} aria-hidden="true" className="water-route-map" />
        <Boat size={38} weight="light" className="water-route-boat" aria-hidden="true" />
        <span className="water-route-label water-route-label-venice">{t("Venice address")}</span>
        <span className="water-route-label water-route-label-roma">{t("Piazzale Roma")}</span>
        <span className="water-route-label water-route-label-destination">{t("Final destination")}</span>
      </div>
    </section>
  )
}
