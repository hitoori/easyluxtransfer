import { t, useLocale } from '../../i18n/locale'
import BookingForm from '../BookingForm'
import type { QuoteSelection } from './serviceData'
import './service-quote.css'

export default function ServiceQuoteForm({ selection }: { selection: QuoteSelection | null }) {
  useLocale()
  return <section id="service-custom" className="sv-section sv-quote-section sv-quote-shared" aria-labelledby="quote-intro-title">
    <div className="svc-shell sv-quote-layout">
      <div className="sv-quote-heading">
        <div><p className="svc-eyebrow">{t('Request a quote')}</p><h2 id="quote-intro-title">{t('Tell us where you’d like to go.')}</h2></div>
        <p className="sv-lead">{t('Share your travel plans. We’ll check availability and send you a quote for your journey.')}</p>
      </div>
      <BookingForm variant="services" quoteSelection={selection} />
    </div>
  </section>
}
