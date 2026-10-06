import { countLabel, t, useLocale } from '../i18n/locale'
import OptimizedImage from '../components/OptimizedImage'
import { useRef, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { CreditCard, MapPin, AirplaneTilt, Car, Info, WhatsappLogo } from '@phosphor-icons/react'
import { ArrowRight, Close, Minus, Plus, Search } from '../components/PikaIcons'
import { pagePath, type Page } from '../types/navigation'
import { company } from '../config/company'
import { faqTopics } from './faqData'
import './faq.css'
import { publicAsset } from '../lib/publicAsset'

const questions = faqTopics.flatMap(group => [...group.questions])
const categories = [
  { id: 'booking', title: 'Booking & Payment', subtitle: 'Quotes, payment and changes', Icon: CreditCard, ids: ['book', 'price', 'payment', 'modify', 'cancel'] },
  { id: 'journey', title: 'Pick-up & Journey', subtitle: 'Hotels, cruise ports and luggage', Icon: MapPin, ids: ['port', 'bags', 'child'] },
  { id: 'airport', title: 'Airport & Water Taxi', subtitle: 'Flights, Venice hotels and boat connections', Icon: AirplaneTilt, ids: ['meeting', 'delay', 'cancelled-flight', 'hotel', 'combine', 'boat-price'] },
  { id: 'distance', title: 'Long-distance & Hourly', subtitle: 'Stops, returns and longer routes', Icon: Car, ids: ['hourly', 'return', 'stops', 'europe', 'prosecco'] },
  { id: 'general', title: 'Special requests', subtitle: 'Accessibility and pets', Icon: Info, ids: ['access', 'pets'] },
]

export default function FAQ({ navigate }: { navigate: (page: Page) => void }) {
  useLocale()
  const pageRef = useRef<HTMLDivElement>(null)
  useScrollReveal(pageRef, '.fq-sidebar > nav, .fq-results, .fq-help > *')
  const [topic, setTopic] = useState('booking')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const active = categories.find(category => category.id === topic)!
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const searching = words.length > 0
  const visible = searching ? questions.filter(item => words.every(word => `${t(item.q)} ${t(item.a)}`.toLocaleLowerCase().includes(word))) : active.ids.map(id => questions.find(item => item.id === id)!)
  const chooseTopic = (id: string) => { setTopic(id); setQuery(''); setOpen(null) }

  return <div ref={pageRef} className="faq-page">
    <header className="fq-hero" aria-labelledby="faq-title">
      <OptimizedImage src={publicAsset('images/home/vehicle/black-private-van-venice.png')} alt={""} className="fq-hero-photo" fetchPriority="high" />
      <div className="fq-shell fq-hero-content"><div><p className="fq-eyebrow">{t("FAQ")}</p><h1 id="faq-title">{t("Questions about your transfer?")}</h1><p className="fq-intro-copy">{t("Answers about booking, prices, pick-ups, luggage and Venice Water Taxi connections.")}</p></div></div>
    </header>

    <section className="fq-directory fq-shell" aria-label={t("Frequently asked questions")}>
      <aside className="fq-sidebar">
        <nav aria-label={t("FAQ categories")}><p className="fq-eyebrow">{t("Browse by topic")}</p><div className="fq-topic-buttons">{categories.map(({ id, title, subtitle, Icon }) => <button type="button" key={id} aria-pressed={!searching && topic === id} onClick={event => { chooseTopic(id); event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }) }}><Icon size={21} weight="light" aria-hidden="true" /><span><strong>{t(title)}</strong><small>{t(subtitle)}</small></span><ArrowRight size={16} aria-hidden="true" /></button>)}</div></nav>
      </aside>

      <div className="fq-results" data-reveal-delay="70">
        <div className="fq-results-toolbar"><div className="fq-results-title"><span className="fq-index">{t(searching ? 'Search' : `0${categories.indexOf(active) + 1}`)}</span><h2>{t(searching ? 'Search results' : active.title)}</h2></div><div className="fq-search" role="search"><Search size={18} aria-hidden="true" /><input type="search" aria-label={t("Search questions")} placeholder={t("Search questions")} value={query} onChange={event => { setQuery(event.target.value); setOpen(null) }} />{query && <button aria-label={t("Clear search")} onClick={() => { setQuery(''); setOpen(null) }}><Close size={17} aria-hidden="true" /></button>}</div></div>
        <div className="fq-results-content" key={searching ? 'search' : topic}>
          <div className="fq-results-heading">{searching && <p>{t("Matching answers from every topic.")}</p>}<span className="fq-count" role="status">{countLabel(visible.length, 'question')}</span></div>
          <div className="fq-questions">{visible.map(item => <article className={`fq-question${open === item.id ? ' is-open' : ''}`} key={item.id}><h3><button type="button" id={`fq-question-${item.id}`} aria-expanded={open === item.id} aria-controls={`fq-answer-${item.id}`} onClick={() => setOpen(open === item.id ? null : item.id)}>{t(item.q)}{open === item.id ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}</button></h3><div id={`fq-answer-${item.id}`} role="region" aria-labelledby={`fq-question-${item.id}`} aria-hidden={open !== item.id} className="fq-answer"><div><p>{t(item.a)}</p>{["payment", "modify", "cancel", "cancelled-flight"].includes(item.id) && <p><a href={pagePath("terms")} target="_blank" rel="noopener noreferrer">{t("Booking Terms & Conditions")}</a></p>}</div></div></article>)}</div>
          {!visible.length && <div className="fq-empty"><h3>{t("No matching questions.")}</h3><p>{t("Try “luggage”, “flight” or “payment”, or contact us about your journey.")}</p><button className="fq-text-link" onClick={() => setQuery('')}>{t("Back to ")}{t(active.title)} <ArrowRight size={17} aria-hidden="true" /></button></div>}
        </div>
      </div>
    </section>

    <section className="fq-help fq-shell" aria-labelledby="fq-help-title">
      <OptimizedImage src={publicAsset('images/home/hero/venice-grand-canal.jpg')} alt={t("Venice’s Grand Canal and waterfront architecture")} loading="lazy" />
      <div className="fq-help-copy"><p className="fq-eyebrow">{t("Contact Easy Lux")}</p><h2 id="fq-help-title">{t("Still have a question?")}</h2><p>{t("Send us a message or ask us on WhatsApp.")}</p><div className="fq-actions"><button className="fq-button" onClick={() => navigate('contact')}>{t("Contact us ")}<ArrowRight size={17} aria-hidden="true" /></button><a className="fq-button fq-button-secondary" href={company.phones[0].whatsapp}><WhatsappLogo size={18} aria-hidden="true" />{t("WhatsApp us ")}<ArrowRight size={17} aria-hidden="true" /></a></div></div>
    </section>
  </div>
}
