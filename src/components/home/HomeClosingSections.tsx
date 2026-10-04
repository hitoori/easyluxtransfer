import { t, useLocale } from '../../i18n/locale'
import ClientStories from './ClientStories'
import JourneyRequest from './JourneyRequest'

interface HomeClosingSectionsProps {
  onPlanJourney: () => void
}

const bookingSteps = [
  ['01', 'Share your journey', 'Tell us your route, date, passengers and any stops or special requests.'],
  ['02', 'Confirm the details', 'We check availability and send your price and deposit details. Your booking is confirmed once the deposit is received.'],
  ['03', 'Meet your chauffeur', 'Your chauffeur will be waiting at the agreed meeting point, ready for your journey.'],
]

export default function HomeClosingSections({ onPlanJourney }: HomeClosingSectionsProps) {
  useLocale()
  return (
    <div className="home-closing">
      <section className="h2-process booking-process" aria-labelledby="booking-process-title">
        <div className="booking-process-intro">
          <p className="h2-kicker">{t("Process")}</p>
          <h2 id="booking-process-title">{t("How booking works.")}</h2>
        </div>
        <ol className="booking-process-steps">
          {bookingSteps.map(([number, title, copy]) => (
            <li key={number}>
              <span className="booking-process-number" aria-hidden="true">{t(number)}</span>
              <h3>{t(title)}</h3>
              <p>{t(copy)}</p>
            </li>
          ))}
        </ol>
        <button type="button" className="booking-process-start" onClick={onPlanJourney}>
          {t("Request a quote ")}<span aria-hidden="true">{"→"}</span>
        </button>
      </section>

      <ClientStories />

      <JourneyRequest />

    </div>
  )
}
