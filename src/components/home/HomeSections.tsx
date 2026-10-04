import { getLocale, message, t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useRef, useState } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import {
  ArrowRight,
  CaretDown,
} from '@phosphor-icons/react'
import type { BookingPrefill } from '../BookingForm'
import type { Page } from '../../types/navigation'
import { popularTransferRoutes } from '../../data/transferRoutes'
import VeniceArrivalFeature from '../VeniceArrivalFeature'
import HomeClosingSections from './HomeClosingSections'
import PrivateJourneys from './PrivateJourneys'

interface HomeSectionsProps {
  navigate: (page: Page) => void
  onBookRoute: (route: Omit<BookingPrefill, 'requestId'>) => void
  onPlanJourney: () => void
}

const services = [
  {
    title: 'Airport & City Transfers',
    description: 'Pick-ups and drop-offs at Marco Polo and Treviso airports, hotels, addresses and cruise terminals.',
    page: 'services' as const,
  },
  {
    title: 'Chauffeur by the Hour',
    description: 'A driver for meetings, shopping or sightseeing. Stops and waiting time are agreed in advance.',
    page: 'services' as const,
  },
  {
    title: 'Italy & Europe Transfers',
    description: 'Travel between Italian cities or onward to Austria, Slovenia, Croatia and France. Add stops along the way.',
    page: 'services' as const,
  },
  {
    title: 'Mountains & Seaside',
    description: 'Private transfers to the Dolomites and the coast, with a return pick-up if you need one.',
    page: 'services' as const,
  },
]

const initialRouteCount = 5

const formatPrice = (price: number) => `€${new Intl.NumberFormat(getLocale()).format(price)}`
const displayRoutePlace = (place: string) => place.replace(/ (TV|VE|PD|VR|BZ|BL)$/, '')

export default function HomeSections({ navigate, onBookRoute, onPlanJourney }: HomeSectionsProps) {
  useLocale()
  const flowRef = useRef<HTMLDivElement>(null)
  useScrollReveal(flowRef, '.home-flow-section')
  const [visibleRouteCount, setVisibleRouteCount] = useState(initialRouteCount)
  const allPopularRoutesVisible = visibleRouteCount >= popularTransferRoutes.length

  const handleRoutesButton = () => {
    if (allPopularRoutesVisible) {
      navigate('services')
      return
    }

    setVisibleRouteCount(popularTransferRoutes.length)
  }


  return (
    <div ref={flowRef} className="home-sections-flow">
      <section
        id="ways-to-travel"
        data-home-services
        className="home-flow-section bg-[var(--background-secondary)] px-6 pb-8 pt-16 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12 lg:pt-20"
      >
        <div className="mx-auto max-w-[1340px]">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-[clamp(44px,13vw,54px)] font-normal leading-[1.02] text-cream sm:text-[68px] lg:text-[80px]">
              {t("Our services")}</h2>
            <button
              type="button"
              onClick={() => navigate('services')}
              className="group mt-4 flex items-center gap-2 text-[12px] font-medium text-gold transition-colors hover:text-gold-light"
            >
              {t("Explore transfer services")}<ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="home-service-grid mt-9 grid border-t border-[rgba(36,41,44,0.84)] sm:mt-11 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => (
              <button
                key={service.title}
                type="button"
                onClick={() => navigate(service.page)}
                className={`home-service-item group flex min-h-[204px] flex-col border-b border-[rgba(36,41,44,0.72)] py-7 text-left transition-[background-color,box-shadow,transform] duration-200 hover:bg-[rgba(13,14,15,0.38)] active:scale-[0.995] sm:min-h-[224px] sm:border-b-0 sm:px-7 xl:min-h-[238px] xl:border-t-0 xl:px-7 ${
                  index > 1 ? 'sm:border-t sm:border-[rgba(36,41,44,0.72)]' : ''
                } ${
                  index % 2 === 0 ? 'sm:pl-0' : 'sm:border-l'
                } ${
                  index === 0 ? 'xl:pl-0' : 'xl:border-l'
                }`}
              >
                <span className="home-service-title max-w-[270px] font-display text-[27px] leading-[1.02] text-cream xl:text-[28px]">
                  {t(service.title)}
                </span>
                <span className="home-service-description mt-4 max-w-[290px] text-[14px] leading-[1.68] text-[var(--text-muted)]">
                  {t(service.description)}
                </span>
                <ArrowRight
                  size={14}
                  className="home-service-arrow mt-auto text-[rgba(200,192,181,0.56)] transition-transform group-hover:translate-x-1 group-hover:text-gold-light"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col">
      <section
        data-home-vehicle
        aria-labelledby="home-vehicle-title"
        className="home-flow-section order-2 h2-fleet"
      >
        <div className="h2-fleet-editorial">
          <OptimizedImage className="h2-fleet-exterior" src={publicAsset('images/home/vehicle/chauffeur-pickup.jpg')} alt={t("Chauffeur welcoming a passenger into a black private transfer van")} />
          <div className="h2-fleet-content">
            <div className="h2-fleet-heading">
              <p className="h2-kicker">{t("Private vehicle")}</p>
              <h2 id="home-vehicle-title">{t("The right vehicle for your group.")}</h2>
              <p>{t("Tell us how many people and bags are travelling. We’ll confirm a suitable vehicle before you book.")}</p>
            </div>
            <div className="h2-fleet-gallery">
              <OptimizedImage src={publicAsset('images/shared/private-van-passenger-cabin.png')} sizes="(max-width: 760px) 100vw, 35vw" alt={t("Passenger seating inside the private transfer van")} />
              <OptimizedImage src={publicAsset('images/home/vehicle/chauffeur-luggage-assistance.png')} sizes="(max-width: 760px) 100vw, 35vw" alt={t("Chauffeur assisting with luggage")} />
            </div>
            <div className="h2-fleet-benefits">
              <article><h3>{t("Prepared for you")}</h3><p>{t("Passenger and luggage details checked before confirmation.")}</p></article>
              <article><h3>{t("Comfort on board")}</h3><p>{t("Climate control, water and charging.")}</p></article>
              <article><h3>{t("Help with luggage")}</h3><p>{t("Your driver assists with luggage at pick-up and arrival.")}</p></article>
            </div>
          </div>
        </div>
      </section>

      <section
        data-home-routes
        className="home-flow-section order-1 bg-[var(--background)] px-6 pb-16 pt-12 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12"
      >
        <div className="mx-auto max-w-[1340px]">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-[44px] font-normal leading-[0.98] text-cream sm:text-[54px]">
                {t("Popular Routes & Prices")}</h2>
              <p className="mt-4 max-w-[650px] text-[14px] leading-[1.7] text-[var(--text-muted)]">
                {t("Indicative one-way fares from Venice. We’ll confirm the vehicle and final price with your quote.")}</p>
            </div>
            <button
              type="button"
              onClick={onPlanJourney}
              className="group flex min-h-[48px] w-fit shrink-0 items-center gap-3 border border-[rgba(194,154,69,0.55)] px-5 text-[12px] font-semibold uppercase tracking-[0.1em] text-gold-light transition-colors hover:bg-gold hover:text-[var(--background)]"
            >
              {t("Request a different route")}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-11 hidden grid-cols-[minmax(0,2fr)_0.54fr_0.54fr_0.68fr_176px] items-end border-b border-[rgba(36,41,44,0.9)] pb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-metadata)] lg:grid">
            <span>{t("Route")}</span>
            <span className="text-center">{t("Sedan")}</span>
            <span className="text-center">{t("Van")}</span>
            <span className="text-center">{t("Minibus 12")}</span>
            <span className="text-right">{t("Action")}</span>
          </div>

          <div id="additional-popular-routes" className="mt-7 lg:mt-0">
            {popularTransferRoutes.slice(0, visibleRouteCount).map((route) => (
              <article
                key={route.id}
                className="grid gap-5 border-b border-[rgba(36,41,44,0.82)] py-7 lg:grid-cols-[minmax(0,2fr)_0.54fr_0.54fr_0.68fr_176px] lg:items-center lg:gap-0"
              >
                <div className="flex min-w-0 items-stretch gap-5">
                  <span className="w-0.5 shrink-0 bg-[var(--gold)]" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-[24px] leading-[1.1] text-cream sm:text-[27px]">
                      {t(displayRoutePlace(route.from))} {" → "}{t(displayRoutePlace(route.to))}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-[rgba(36,41,44,0.9)] lg:contents">
                  {[
                    ['Sedan', route.sedan],
                    ['Van', route.van],
                    ['Minibus 12', route.minibus],
                  ].map(([label, price]) => (
                    <div key={label} className="text-center lg:border-l lg:border-[rgba(36,41,44,0.9)] lg:px-3">
                      <span className="block text-[11px] uppercase tracking-[0.1em] text-[var(--text-metadata)] lg:hidden">
                        {t(label)}
                      </span>
                      <span className="mt-1 block text-[18px] tabular-nums text-[var(--text-secondary)] lg:mt-0 lg:text-[20px]">
                        {t(formatPrice(price as number))}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onBookRoute({
                      pickup: route.pickup,
                      destination: route.destination,
                      airportMode: route.airportMode,
                    })
                  }
                  className="min-h-[44px] whitespace-nowrap border border-[rgba(194,154,69,0.5)] px-4 !text-[11px] !font-semibold !leading-none uppercase tracking-[0.09em] text-gold-light transition-colors hover:bg-gold hover:text-[var(--background)]"
                  aria-label={message('Request transfer from {0} to {1}', t(displayRoutePlace(route.from)), t(displayRoutePlace(route.to)))}
                >
                  {t("Request this route")}</button>
              </article>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-center gap-5">
            <span className="h-px flex-1 bg-[rgba(36,41,44,0.82)]" aria-hidden="true" />
            <button
              type="button"
              onClick={handleRoutesButton}
              aria-expanded={visibleRouteCount > initialRouteCount}
              aria-controls="additional-popular-routes"
              className="group flex items-center gap-3 px-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--gold)] transition-colors hover:text-gold-light"
            >
              {t(allPopularRoutesVisible ? 'View all routes & prices' : 'Show more routes')}
              {allPopularRoutesVisible ? (
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              ) : (
                <CaretDown size={15} className="transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              )}
            </button>
            <span className="h-px flex-1 bg-[rgba(36,41,44,0.82)]" aria-hidden="true" />
          </div>
        </div>
      </section>
      </div>

      <VeniceArrivalFeature onPlanJourney={onPlanJourney} />

      <PrivateJourneys onBookRoute={onBookRoute} />

      <HomeClosingSections onPlanJourney={onPlanJourney} />
    </div>
  )
}
import { publicAsset } from '../../lib/publicAsset'
