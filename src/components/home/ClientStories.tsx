import { t, useLocale } from '../../i18n/locale'
import { useRef } from 'react'
import { useCarousel } from '../../hooks/useCarousel'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'

const stories = [
  ['Airport transfer', 'Marco Polo Airport', 'Our flight was delayed, but Mihai was there when we arrived. The V-Class was spotless, and the drive was really comfortable.'],
  ['Dolomites', 'Private day journey', 'We booked a driver for our day in the Dolomites. The timing worked well, and we could just enjoy the stops instead of worrying about the drive.'],
  ['Prosecco Hills', 'Private day journey', 'The Prosecco Hills were one of our favourite days in Italy. We had time to enjoy the places we visited without feeling rushed.'],
  ['Group transfer', 'Private transfer', 'The driver arrived on time, and there was plenty of room for all of us and our bags. Everything was straightforward.'],
]

export default function ClientStories() {
  useLocale()
  const sectionRef = useRef<HTMLElement>(null)
  const carousel = useCarousel(stories.length, 8000, sectionRef)
  const activeIndex = carousel.activeIndex
  const [name, place, quote] = stories[activeIndex]
  const move = (direction: number) => { void carousel.select((activeIndex + direction + stories.length) % stories.length) }
  const indicator = <>{t(String(activeIndex + 1).padStart(2, '0'))} <span>{"/ "}{t(String(stories.length).padStart(2, '0'))}</span></>

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
              <blockquote>{t(quote)}</blockquote>
            </div>
            <figcaption><strong>{t(name)}</strong><span>{t(place)}</span></figcaption>
          </figure>
        </div>

        <div className="client-stories-footer">
          <div className="client-stories-progress" aria-hidden="true">
            {stories.map(([author], index) => <span key={author} className={index === activeIndex ? 'is-active' : undefined} />)}
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
