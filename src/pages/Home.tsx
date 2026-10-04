import { message, t, useLocale } from '../i18n/locale'
import OptimizedImage from '../components/OptimizedImage'
import { prepareImage, useCarousel } from '../hooks/useCarousel'
import { useRef, useState } from 'react'
import type { Page } from '../types/navigation'
import BookingForm, { type BookingPrefill } from '../components/BookingForm'
import HomeSections from '../components/home/HomeSections'
import { publicAsset } from '../lib/publicAsset'
import './home-editorial.css'
import './home-refinements.css'

interface HomeProps {
  navigate: (page: Page) => void
}

const heroSlides = [
  {
    url: publicAsset('images/home/hero/venice-canal-boats.jpg'),
    label: 'Boats on Venice Grand Canal',
    caption: 'Venice · Grand Canal',
    position: 'center 58%',
  },
  {
    url: publicAsset('images/home/hero/dolomites-green-valley.jpg'),
    label: 'Green valley beneath the Dolomites',
    caption: 'Dolomites · Green valley',
    position: 'center 58%',
  },
  {
    url: publicAsset('images/home/hero/dolomites-cave-peaks.jpg'),
    label: 'Dolomite peaks framed by a mountain cave',
    caption: 'Dolomites · Mountain peaks',
    position: 'center 58%',
  },
  {
    url: publicAsset('images/home/hero/alpine-lakeside-cabin.jpg'),
    label: 'Cabin beside an alpine lake',
    caption: 'Alps · Lakeside cabin',
    position: 'center 58%',
  },
]

const prepareHero = (index: number) => prepareImage(heroSlides[index].url, '100vw')

export default function Home({ navigate }: HomeProps) {
  useLocale()
  const heroRef = useRef<HTMLElement>(null)
  const carousel = useCarousel(heroSlides.length, 8000, heroRef, prepareHero)
  const activeSlide = carousel.activeIndex
  const [routePrefill, setRoutePrefill] = useState<BookingPrefill | null>(null)

  const scrollToBooking = () => {
    document.getElementById('home-booking')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  }

  const bookRoute = (route: Omit<BookingPrefill, 'requestId'>) => {
    setRoutePrefill((current) => ({
      ...route,
      requestId: (current?.requestId ?? 0) + 1,
    }))
    window.setTimeout(scrollToBooking, 0)
  }

  return (
    <div className="home-page overflow-hidden bg-[var(--background)]">
      <section
        ref={heroRef}
        data-home-hero
        className="h2-hero relative overflow-hidden bg-[var(--background)]"
      >
        {heroSlides.map((slide, index) => (index === activeSlide || index === carousel.previousIndex) ? (
          <OptimizedImage key={slide.url} src={slide.url} alt={t(slide.label)}
            aria-hidden={index !== activeSlide}
            className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
            style={{ objectPosition: slide.position }} sizes="100vw"
            loading="eager" fetchPriority={index === 0 ? 'high' : 'auto'}
          />
        ) : null)}
        <div className="h2-hero-shade" />

        <div className="h2-hero-copy">
          <p className="h2-kicker">{t("PRIVATE CHAUFFEUR SERVICE · VENICE & TREVISO")}</p>
          <h1>
            {t("Private transfers from")}<br className="home-hero-mobile-break" />{' '}
            {t("Venice,")}<br className="home-hero-desktop-break" />{' '}
            <span>{t("across Italy")}<br className="home-hero-mobile-break" />{' '}{t("and Europe.")}</span>
          </h1>
          <p className="h2-lead">{t("Airport pick-ups, city transfers, a chauffeur by the hour and longer journeys.")}</p>
        </div>

        <div
          id="home-booking"
          className="h2-booking-wrap"
        >
          <div className="mx-auto w-full">
            <BookingForm prefill={routePrefill} />
          </div>
          <nav {...carousel.interactionProps} className="hero-photo-nav" aria-label={t("Hero photographs")}>
            <p className="hero-photo-caption" aria-live="polite" aria-atomic="true">
              {t(heroSlides[activeSlide].caption)}
            </p>
            <div className="hero-photo-controls">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  aria-label={message('Show {0} background', t(slide.label))}
                  aria-current={index === activeSlide ? 'true' : undefined}
                  onClick={() => void carousel.select(index)}
                >
                  <span />
                </button>
              ))}
            </div>
          </nav>
        </div>
        <p className="sr-only" aria-live="polite">
          {t(routePrefill
            ? message('{0} to {1} added to the booking form.', t(routePrefill.pickup), t(routePrefill.destination))
            : '')}
        </p>
      </section>

      <HomeSections navigate={navigate} onBookRoute={bookRoute} onPlanJourney={scrollToBooking} />
    </div>
  )
}
