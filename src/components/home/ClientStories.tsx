import { t, useLocale } from '../../i18n/locale'
import { useRef, useState } from 'react'
import { useCarousel } from '../../hooks/useCarousel'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { clientReviews } from '../../data/clientReviews'

export default function ClientStories() {
  const { language } = useLocale()
  const sectionRef = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState(false)
  const carousel = useCarousel(clientReviews.length, 8000, sectionRef, undefined, expanded)
  const activeIndex = carousel.activeIndex
  const review = clientReviews[activeIndex]
  const move = (direction: number) => {
    setExpanded(false)
    void carousel.select((activeIndex + direction + clientReviews.length) % clientReviews.length)
  }
  const indicator = <>{t(String(activeIndex + 1).padStart(2, '0'))} <span>{"/ "}{t(String(clientReviews.length).padStart(2, '0'))}</span></>

  return (
    <section ref={sectionRef} {...carousel.interactionProps} className="h2-testimonials client-stories" aria-labelledby="client-stories-title">
      <div className="home-flow-section client-stories-content">
        <header className="client-stories-heading">
          <div>
            <p className="client-stories-kicker">{t("In their words")}</p>
            <h2 id="client-stories-title">{t("What our clients say.")}</h2>
          </div>
          <div className="client-stories-controls client-stories-controls--desktop" aria-label={t("Review navigation")}>
            <button type="button" onClick={() => move(-1)} aria-label={t("Previous review")}><ArrowLeft size={24} weight="light" aria-hidden="true" /></button>
            <span className="client-stories-indicator">{t(indicator)}</span>
            <button type="button" onClick={() => move(1)} aria-label={t("Next review")}><ArrowRight size={24} weight="light" aria-hidden="true" /></button>
          </div>
        </header>

        <div className="client-stories-stage" aria-live="polite" aria-atomic="true">
          <figure key={activeIndex}>
            <span className="client-stories-stars" aria-label={t("Five stars")}>{"★★★★★"}</span>
            <div className="client-stories-quote-line">
              <span className="client-stories-quote-icon" aria-hidden="true">{"“"}</span>
              <blockquote id="client-review-text">{t(expanded || !review.preview ? review.quote : review.preview)}</blockquote>
            </div>
            {review.preview && <button type="button" className="client-stories-read-more" aria-expanded={expanded} aria-controls="client-review-text" onClick={() => setExpanded(value => !value)}>
              {t(expanded ? 'Show less' : 'Read full review')}
            </button>}
            <figcaption>
              <strong>{review.author}</strong>
              <span>{t('Google review')}</span>
              {(language === 'ru' || review.translatedByGoogle) && <span className="client-stories-translation">{t(language === 'ru' ? 'Translation' : 'Translated by Google')}</span>}
            </figcaption>
          </figure>
        </div>

        <div className="client-stories-footer">
          <div className="client-stories-progress" aria-hidden="true">
            {clientReviews.map(({ author }, index) => <span key={author} className={index === activeIndex ? 'is-active' : undefined} />)}
          </div>
          <div className="client-stories-controls client-stories-controls--mobile" aria-label={t("Review navigation")}>
            <button type="button" onClick={() => move(-1)} aria-label={t("Previous review")}><ArrowLeft size={24} weight="light" aria-hidden="true" /></button>
            <span className="client-stories-indicator">{t(indicator)}</span>
            <button type="button" onClick={() => move(1)} aria-label={t("Next review")}><ArrowRight size={24} weight="light" aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </section>
  )
}
