import { t, useLocale } from '../../i18n/locale'
import type { Page } from '../../types/navigation'

const questions = [
  ['Which transfer service should I choose?', 'Choose Airport & City for airport or local journeys, By the Hour for a driver who stays with you, or the section that matches your destination: Water Taxi, Italy & Europe, Prosecco Hills, Mountains, Seaside or Cruise Ports. You can request a different destination if it is not listed.'],
  ['Can I combine a road transfer with a Water Taxi in Venice?', 'Yes. For destinations that need water access, your chauffeur can take you to the agreed handover point and a private Water Taxi can continue to your hotel or the nearest available landing. We confirm access before departure.'],
  ['Can my route include stops or a return journey?', 'Yes. Add any stops, waiting time or return pick-up to your request. We’ll include them in your quote.'],
  ['Which cruise terminals can you serve?', 'Ravenna, Trieste and Fusina. Include your ship and terminal details when you request a quote.'],
]

export default function PricingGuide({ navigate }: { navigate: (page: Page) => void }) {
  useLocale()
  return <section className="services-pricing-guide" aria-labelledby="services-pricing-title">
    <div className="svc-shell services-pricing-layout">
      <div className="services-pricing-heading">
        <div>
          <p className="svc-eyebrow">{t("Useful to know")}</p>
          <h2 id="services-pricing-title">{t("Quick answers")}</h2>
        </div>
        <button type="button" className="services-pricing-link" onClick={() => navigate('faq')}>
          {t("Explore all FAQs ")}<span aria-hidden="true">{"→"}</span>
        </button>
      </div>
      <div className="services-pricing-questions">
        {questions.map(([question, answer]) => <details key={question}>
          <summary>{t(question)}<span aria-hidden="true" /></summary>
          <p>{t(answer)}</p>
        </details>)}
      </div>
    </div>
  </section>
}
