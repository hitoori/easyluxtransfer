import { useEffect, useRef, useState, type ReactNode } from 'react'
import { t, useLocale } from '../i18n/locale'
import { company } from '../config/company'
import { pagePath } from '../types/navigation'
import './privacy-policy.css'
import './booking-terms.css'

const chapters = [
  ['provider', 'Our company & services'],
  ['confirmation', 'Requests & confirmation'],
  ['payment', 'Prices, deposit & payment'],
  ['cancellation', 'Cancellations & refunds'],
  ['changes', 'Changes & travel delays'],
  ['journey', 'Preparing for your journey'],
  ['provider-cancellation', 'If we cannot provide your transfer'],
  ['contact', 'Contact & your rights'],
] as const

function Chapter({ index, children }: { index: number; children: ReactNode }) {
  const [id, title] = chapters[index]
  return <section id={`terms-${id}`} aria-labelledby={`terms-${id}-title`} className="privacy-chapter">
    <h2 id={`terms-${id}-title`}><span aria-hidden="true">{t(String(index + 1).padStart(2, '0'))}</span>{t(title)}</h2>
    {children}
  </section>
}

export default function Terms() {
  useLocale()
  const pageRef = useRef<HTMLElement>(null)
  const [activeChapter, setActiveChapter] = useState<string>(chapters[0][0])
  useEffect(() => {
    const sections = Array.from(pageRef.current?.querySelectorAll<HTMLElement>('.privacy-chapter') ?? [])
    if (!sections.length) return
    let observer: IntersectionObserver | undefined
    const observe = () => {
      observer?.disconnect()
      const marker = Math.min(window.innerHeight - 1, (parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 125) + 1)
      const update = () => {
        let index = 0
        for (let i = 0; i < sections.length; i++) {
          if (sections[i].getBoundingClientRect().top > marker) break
          index = i
        }
        setActiveChapter(chapters[index][0])
      }
      update()
      observer = new IntersectionObserver(update, { rootMargin: `-${marker}px 0px -${Math.max(0, window.innerHeight - marker - 1)}px 0px`, threshold: 0 })
      sections.forEach(section => observer!.observe(section))
    }
    observe()
    window.addEventListener('resize', observe)
    return () => { observer?.disconnect(); window.removeEventListener('resize', observe) }
  }, [])

  return <article ref={pageRef} className="privacy-page booking-terms-page">
    <header className="privacy-heading">
      <p className="privacy-eyebrow">{t("EASY LUX · YOUR BOOKING")}</p>
      <h1>{t("Booking Terms & Conditions")}</h1>
      <p className="privacy-intro">{t("Clear arrangements for your journey: how we confirm your booking, take payment and handle changes or cancellations.")}</p>
      <p className="privacy-updated">{t("Last updated ")}<time dateTime="2026-10-07">{t("7 October 2026")}</time></p>
      <ul className="privacy-highlights" aria-label={t("Booking at a glance")}>
        <li>{t("Deposit to confirm")}</li><li>{t("Balance paid after your journey")}</li><li>{t("24-hour cancellation window")}</li>
      </ul>
    </header>
    <div className="privacy-layout">
      <aside className="privacy-contents">
        <nav aria-label={t("Booking Terms contents")}><p className="privacy-eyebrow">{t("IN THESE TERMS")}</p>
          <ol>{chapters.map(([id, title], index) => <li key={id}><a href={`#terms-${id}`} aria-current={activeChapter === id ? 'location' : undefined}><span className="privacy-nav-number" aria-hidden="true">{t(String(index + 1).padStart(2, '0'))}</span><span className="privacy-nav-label">{t(title)}</span></a></li>)}</ol>
        </nav>
        <div className="privacy-contact"><span>{t("Booking enquiries")}</span><a href={`mailto:${company.email}`}>{company.email}</a></div>
      </aside>
      <div className="privacy-body">
        <Chapter index={0}>
          <p>{t("Easy Lux Transfer is operated by ")}<strong>{company.legalName}</strong>{t(". These terms explain the arrangements for private transfers, hourly chauffeur services and private journeys agreed with our team.")}</p>
          <dl className="privacy-company"><div><dt>{t("Registered office")}</dt><dd>{t(company.registeredOffice)}</dd></div><div><dt>{t("Partita IVA / VAT number")}</dt><dd>IT{company.vatNumber}</dd></div><div><dt>{t("Email")}</dt><dd><a href={`mailto:${company.email}`}>{company.email}</a></dd></div></dl>
        </Chapter>
        <Chapter index={1}>
          <p>{t("Sending a website form, email or WhatsApp message is a request for availability and a quote. It does not confirm a booking or require payment for a journey.")}</p>
          <p>{t("We confirm the route, pick-up date and time, passengers, vehicle arrangements, extras, total fare and deposit with you. Your booking is confirmed after agreement of these details and terms, receipt of the agreed deposit and confirmation from our team. Please keep your booking confirmation.")}</p>
          <p>{t("We provide these terms before you confirm the booking or pay the deposit. Accepting cookies or the form’s contact acknowledgement does not mean you have accepted a paid booking.")}</p>
        </Chapter>
        <Chapter index={2}>
          <p>{t("Website prices are indicative. Your final quote sets out the total fare and what is included. Any additional services or charges must be explained and agreed before they are provided.")}</p>
          <p>{t("A deposit is required to reserve your booking. Its amount and payment method are agreed with you before payment. The deposit is part of the total fare and is deducted from the amount remaining to pay.")}</p>
          <p><strong>{t("The remaining balance is paid directly to the driver after your journey is completed.")}</strong> {t("Please agree the available payment method with our team before you travel. Do not send card details through the website enquiry form.")}</p>
        </Chapter>
        <Chapter index={3}>
          <p>{t("If you need to cancel, contact us by email or WhatsApp as soon as possible. Include your name, booking reference if available, and the journey you wish to cancel. We will acknowledge your cancellation.")}</p>
          <dl className="privacy-purpose-list terms-cancellation-rules">
            <div><dt>{t("At least 24 hours before pick-up")}</dt><dd>{t("If we receive your cancellation at least 24 hours before the agreed pick-up time, your deposit is refunded in full. Exactly 24 hours before pick-up is included in this refund window.")}</dd></div>
            <div><dt>{t("Less than 24 hours before pick-up")}</dt><dd>{t("For a customer cancellation received less than 24 hours before the agreed pick-up time, the agreed deposit is retained as the late-cancellation charge, because the vehicle and driver’s time have been reserved for your journey. This does not limit refunds or other remedies required by applicable law.")}</dd></div>
          </dl>
          <p>{t("The deadline is calculated from the pick-up date and time in your booking confirmation, using the local time at the pick-up location. It depends on when your cancellation reaches us, not on when we reply. We will arrange any refund due with you without undue delay.")}</p>
          <p>{t("For a return journey or multiple transfers, clearly identify which journey you are cancelling. The confirmation should show each pick-up time and the deposit allocated to the relevant service.")}</p>
        </Chapter>
        <Chapter index={4}>
          <p>{t("Contact us promptly if your date, time, route, flight, passenger count or luggage changes. Tell us the new details so we can check availability and whether the fare changes.")}</p>
          <p>{t("A requested change is not automatic: it takes effect only after our team confirms the revised arrangements and you agree any price difference. If a change cannot be arranged and you decide to cancel, the cancellation rules above apply, subject to your statutory rights.")}</p>
          <p>{t("For airport pick-ups, provide your flight number and let us know immediately about a replacement or cancelled flight. We will check how a delay affects your pick-up. Included waiting time and any additional waiting charges are agreed in your quote or confirmation; flight disruption does not automatically confirm a new transfer date.")}</p>
          <p>{t("If you cannot find your driver or reach the meeting point on time, call or message us immediately so we can help coordinate the pick-up.")}</p>
        </Chapter>
        <Chapter index={5}>
          <p>{t("Please check your confirmation and provide accurate pick-up details, passenger numbers and luggage requirements. Request child seats, mobility arrangements, pets, large luggage or additional stops before booking so we can confirm a suitable vehicle and any agreed costs.")}</p>
          <p>{t("Be ready at the agreed meeting point and follow the driver’s safety instructions. Passengers must use the appropriate seat belts and child restraints. We cannot carry passengers or luggage beyond the vehicle’s permitted capacity.")}</p>
          <p>{t("A water taxi, winery tasting, guided visit or other third-party service is included only if expressly stated in your quote. If a service is booked separately with another operator, its terms must be provided before you agree to it.")}</p>
        </Chapter>
        <Chapter index={6}>
          <p>{t("If we cannot provide the agreed transfer, we will contact you as soon as possible. Any alternative arrangement requires your agreement. If the service is cancelled by us and you do not agree to an alternative, we will refund the amounts paid for the unprovided service.")}</p>
          <p>{t("This refund does not replace or limit any compensation or other remedy you are entitled to under applicable law. The customer late-cancellation charge does not apply when we cancel or fail to provide the agreed service.")}</p>
        </Chapter>
        <Chapter index={7}>
          <p>{t("For changes, cancellations or a complaint, contact our team with your booking details. Email or WhatsApp gives you a written record; for an urgent pick-up issue, you can also call us.")}</p>
          <div className="terms-contact-links"><a href={`mailto:${company.email}`}>{company.email}</a>{company.phones.map(phone => <div key={phone.tel}><a href={phone.tel}>{phone.display}</a><a href={phone.whatsapp}>{t("WhatsApp")}</a></div>)}</div>
          <p>{t("These terms are governed by Italian law, without removing mandatory consumer protections applicable to you. They do not exclude liability or restrict your right to bring a complaint or seek a legal remedy where applicable law protects that right.")}</p>
          <p>{t("Changes to this page apply to future bookings. The terms provided and agreed when your booking is confirmed continue to apply to that booking unless we agree a change with you.")}</p>
          <p>{t("For information about your personal data and cookie choices, read our ")}<a href={pagePath('cookies')}>{t("Privacy Policy")}</a>{"."}</p>
        </Chapter>
      </div>
    </div>
  </article>
}
