import { t, useLocale } from '../i18n/locale'
import OptimizedImage from '../components/OptimizedImage'
import { useRef, type CSSProperties } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { WhatsappLogo } from '@phosphor-icons/react'
import { ArrowRight } from '../components/PikaIcons'
import { company } from '../config/company'
import type { Page } from '../types/navigation'
import './about.css'

interface AboutProps { navigate: (page: Page) => void }

type PhotoSlotProps = {
  className?: string
  src: string
  alt: string
  ratio: string
  position?: string
  eager?: boolean
}

function PhotoSlot({ className = '', src, alt, ratio, position = 'center', eager = false }: PhotoSlotProps) {
  useLocale()
  const style = { '--ab-ratio': ratio.replace(':', ' / '), '--ab-position': position } as CSSProperties

  return (
    <div className={`ab-photo-slot ${className}`} style={style}>
      <OptimizedImage sizes={eager ? '(max-width: 760px) 100vw, 60vw' : '(max-width: 760px) 100vw, 50vw'} src={src} alt={t(alt)} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : 'auto'} />
    </div>
  )
}

const facts = ['Two founders', 'Years in private transport', 'Venice & Treviso', 'Italy & Europe']

const standards = [
  {
    number: '01',
    title: 'Planned before you travel',
    description: 'We confirm your route, pick-up time, passengers and luggage in advance.',
  },
  {
    number: '02',
    title: 'A clear pick-up',
    description: 'Your driver meets you at the agreed point and helps with your luggage.',
  },
  {
    number: '03',
    title: 'Genuine Italian hospitality',
    description: 'We want you to feel welcome from the moment you meet your driver.',
  },
]

export default function About({ navigate }: AboutProps) {
  useLocale()
  const pageRef = useRef<HTMLDivElement>(null)
  useScrollReveal(pageRef, '.ab-facts-grid, .ab-story > *, .ab-luxury-layout > *, .ab-standards > p, .ab-standards > h2, .ab-standard-list > article, .ab-collage-grid > *, .ab-operate > *, .ab-manifesto, .ab-final-layout > *')
  return (
    <div ref={pageRef} className="about-page">
      <header className="ab-hero ab-shell" aria-labelledby="about-title">
        <div className="ab-hero-copy">
          <p className="ab-eyebrow">{t("About Easy Lux")}</p>
          <h1 id="about-title">{t("Why we started")}<br />{t("Easy Lux.")}</h1>
          <p className="ab-hero-intro">{t("Private transfers from Venice and Treviso, across Italy and Europe.")}</p>
          <button className="ab-outline-button" type="button" onClick={() => navigate('services')}>
            {t("Discover our services ")}<ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <PhotoSlot className="ab-hero-photo" src={`${import.meta.env.BASE_URL}images/about/airport-transfer-van.png`} alt={t("Black Mercedes van outside an airport at sunset")} ratio="16:10" position="center 52%" eager />
      </header>

      <section className="ab-facts" aria-label={t("Easy Lux at a glance")}>
        <div className="ab-shell ab-facts-grid">
          {facts.map(fact => <span key={fact}>{t(fact)}</span>)}
        </div>
      </section>

      <section className="ab-story ab-shell ab-section ab-split" aria-labelledby="ab-story-title">
        <div className="ab-section-copy">
          <p className="ab-eyebrow">{t("Our story")}</p>
          <h2 id="ab-story-title">{t("A company we believe in.")}</h2>
          <p>{t("We are two young entrepreneurs, united by a passion for travel, hospitality and excellence. After years of experience in the private transportation industry, we decided to turn our vision into reality and create a service built around one fundamental principle: every journey deserves to be exceptional.")}</p>
          <p>{t("Our company was born from dedication, sacrifice and the courage to believe in our dream. We have invested our energy, experience and determination into creating a service where professionalism meets genuine Italian hospitality.")}</p>
        </div>
        <PhotoSlot src={`${import.meta.env.BASE_URL}images/about/story-private-journey.png`} alt={t("Chauffeur loading luggage into a private transfer van at the airport")} ratio="4:3" position="center 48%" />
      </section>

      <section className="ab-luxury ab-section" aria-labelledby="ab-luxury-title">
        <div className="ab-shell ab-split ab-luxury-layout">
          <div className="ab-section-copy">
            <h2 id="ab-luxury-title">{t("Luxury is how")}<br />{t("the journey feels.")}</h2>
            <p>{t("For us, luxury is not simply about travelling in comfort. It is about how you feel throughout the entire experience.")}</p>
          </div>
          <PhotoSlot src={`${import.meta.env.BASE_URL}images/about/car-door.jpg`} alt={t("Hand opening the door of a black car")} ratio="16:7" position="center 34%" />
        </div>
      </section>

      <section className="ab-standards ab-shell ab-section" aria-labelledby="ab-standards-title">
        <p className="ab-eyebrow">{t("What guides us")}</p>
        <h2 id="ab-standards-title">{t("The Easy Lux standard.")}</h2>
        <p className="ab-standards-intro">{t("Our company is the result of our hard work, our ambitions and our belief that passion can become excellence when combined with dedication.")}</p>
        <div className="ab-standard-list">
          {standards.map(standard => (
            <article data-reveal-delay={(Number(standard.number) - 1) * 70} className={`ab-standard${standard.number === '02' ? ' ab-standard-featured' : ''}`} key={standard.number}>
              <span className="ab-standard-number">{t(standard.number)}</span>
              <div className="ab-standard-copy">
                <h3>{t(standard.title)}</h3>
                <p>{t(standard.description)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ab-collage ab-shell ab-section" aria-label={t("The Easy Lux experience")}>
        <div className="ab-collage-grid">
          <figure className="ab-collage-main">
            <PhotoSlot src={`${import.meta.env.BASE_URL}images/about/comfortable-vehicle.png`} alt={t("Black Mercedes private transfer van outside a hotel")} ratio="4:3" position="center" />
            <figcaption>{t("Comfortable vehicles")}</figcaption>
          </figure>
          <div className="ab-collage-side" data-reveal-delay="70">
            <figure>
              <PhotoSlot src={`${import.meta.env.BASE_URL}images/shared/private-van-passenger-cabin.png`} alt={t("Comfortable passenger seating inside the private transfer van")} ratio="16:7" position="center" />
              <figcaption>{t("Comfort on board")}</figcaption>
            </figure>
            <figure>
              <PhotoSlot src={`${import.meta.env.BASE_URL}images/about/personal-chauffeur-service.png`} alt={t("Chauffeur assisting a passenger with luggage beside a private van")} ratio="16:7" position="center" />
              <figcaption>{t("Personal service")}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="ab-operate ab-shell ab-section ab-split" aria-labelledby="ab-operate-title">
        <div className="ab-section-copy">
          <p className="ab-eyebrow">{t("Where we operate")}</p>
          <h2 id="ab-operate-title">{t("From Venice and Treviso, across Italy and Europe.")}</h2>
          <p>{t("We are proud to share the beauty of Italy with our guests, turning every transfer into an opportunity to discover its cities, landscapes and hidden treasures.")}</p>
          <button className="ab-inline-link" type="button" onClick={() => navigate('services')}>
            {t("View all destinations ")}<ArrowRight size={17} aria-hidden="true" />
          </button>
          <p className="ab-countries">{t("Italy · Austria · Slovenia · Croatia · France")}</p>
        </div>
        <PhotoSlot src={`${import.meta.env.BASE_URL}images/about/dolomites-where-we-operate.jpg`} alt={t("Mountain peaks, forest and village in the Dolomites")} ratio="4:3" position="center" />
      </section>

      <section className="ab-manifesto ab-shell ab-section" aria-labelledby="ab-manifesto-title">
        <span className="ab-manifesto-rule" aria-hidden="true" />
        <h2 id="ab-manifesto-title">{t("Driven by passion.")}<br />{t("Committed to excellence.")}</h2>
        <p>{t("Easy Lux")}</p>
        <span className="ab-manifesto-rule" aria-hidden="true" />
      </section>

      <section className="ab-final-cta ab-section" aria-labelledby="ab-final-title">
        <div className="ab-shell ab-split ab-final-layout">
          <div className="ab-section-copy">
            <p className="ab-eyebrow">{t("Ready to travel?")}</p>
            <h2 id="ab-final-title">{t("Tell us where")}<br />{t("you need to be.")}</h2>
            <p>{t("Tell us your pick-up, destination and date. We’ll check availability and send you a quote.")}</p>
            <div className="ab-final-actions">
              <button className="ab-outline-button" type="button" onClick={() => navigate('contact')}>
                {t("Book your ride ")}<ArrowRight size={18} aria-hidden="true" />
              </button>
              <a className="ab-whatsapp-link" href={company.phones[0].whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsappLogo size={19} aria-hidden="true" /> {t(" WhatsApp us ")}<ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
          <PhotoSlot src={`${import.meta.env.BASE_URL}images/about/family-airport-arrival.png`} alt={t("Family arriving at a hotel beside a private chauffeur van")} ratio="16:6" position="center 55%" />
        </div>
      </section>
    </div>
  )
}
