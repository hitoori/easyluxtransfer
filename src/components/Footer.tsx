import { t, useLocale } from '../i18n/locale'
import { CookieSettingsButton } from './CookieConsent'
import OptimizedImage from './OptimizedImage'
import { FacebookLogo, InstagramLogo, TiktokLogo } from '@phosphor-icons/react'
import type { MouseEvent } from 'react'
import { pagePath, type Page } from '../types/navigation'
import { company } from '../config/company'
import './footer.css'
import PageLink, { type Navigate } from './PageLink'

const socialChannels = [
  { label: 'Facebook', href: company.social.facebook, Icon: FacebookLogo },
  { label: 'Instagram', href: company.social.instagram, Icon: InstagramLogo },
  { label: 'TikTok', href: company.social.tiktok, Icon: TiktokLogo },
]

const services = [
  ['airport', 'Airport & City'], ['hourly', 'By the Hour'], ['water-taxi', 'Water Taxi'],
  ['europe', 'Italy & Europe'], ['prosecco', 'Prosecco Hills'], ['mountains', 'Mountains'],
  ['coast', 'Seaside'], ['cruise', 'Cruise Ports'],
] as const

const navigation: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Services & Prices', page: 'services' },
  { label: 'About Us', page: 'about' },
  { label: 'FAQ', page: 'faq' },
  { label: 'Contact', page: 'contact' },
]

export default function Footer({ navigate }: { navigate: Navigate }) {
  useLocale()
  const followPageLink = (event: MouseEvent<HTMLAnchorElement>, page: Page) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(page)
  }

  return (
    <footer className="home-footer">
      <div className="home-footer-main">
        <div className="home-footer-brand">
          <a href={pagePath('home')} className="home-footer-logo" onClick={event => followPageLink(event, 'home')} aria-label={t("Easy Lux Transfer — Home")}>
            <OptimizedImage src={publicAsset('images/brand/easy-lux-site-logo-refined.png')} alt="Easy Lux Transfer" width={80} height={88} loading="lazy" style={{ transform: 'scale(1.42) translate(-1px, -1px)' }} />
            <span className="home-footer-tagline">{t("Your driver")}<br />{t("Around Italy")}</span>
          </a>
          <h2>{t("Private Chauffeur")}</h2>
          <p>{t("Private airport and door-to-door transfers in Venice and Treviso, Water Taxi connections and a driver by the hour.")}<br />{t("We’ll also take you to the mountains, the coast and cruise ports across Italy and Europe.")}</p>
          {socialChannels.some(channel => channel.href) && <div className="home-footer-social" aria-label={t("Easy Lux social media")}>
            {socialChannels.filter(channel => channel.href).map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} · Easy Lux Transfer`}><Icon size={21} weight="regular" aria-hidden="true" /></a>)}
          </div>}
        </div>
        <nav className="home-footer-services" aria-labelledby="home-footer-services">
          <h3 id="home-footer-services">{t("Services")}</h3>
          <ul>{services.map(([id, label]) => <li key={id}><PageLink page="services" sectionId={`service-${id}`} navigate={navigate}>{t(label)}</PageLink></li>)}</ul>
        </nav>
        <nav className="home-footer-navigation" aria-labelledby="home-footer-navigation">
          <h3 id="home-footer-navigation">{t("Navigation")}</h3>
          <ul>{navigation.map(({ label, page }) => <li key={page}><a href={pagePath(page)} onClick={event => followPageLink(event, page)}>{t(label)}</a></li>)}</ul>
        </nav>
        <div className="home-footer-contact">
          <h3>{t("Contact")}</h3>
          <dl>
            <div><dt>{t("Phone & WhatsApp")}</dt><dd className="home-footer-phones">{company.phones.map((phone, index) => <span key={phone.tel}>{index > 0 && <span className="home-footer-phone-divider" aria-hidden="true">{"/"}</span>}<a href={phone.tel}>{t(phone.display)}</a></span>)}</dd></div>
            <div><dt>{t("Email")}</dt><dd><a href={`mailto:${company.email}`}>{t(company.email)}</a></dd></div>
            <div><dt>{t("Operational base")}</dt><dd>{t(company.serviceArea)}</dd></div>
            <div><dt>{t("Registered office")}</dt><dd>{t(company.registeredOffice)}</dd></div>
          </dl>
        </div>
      </div>
      <div className="home-footer-bottom">
        <p>{"© "}<span suppressHydrationWarning>{t(new Date().getFullYear())}</span> {t(" Easy Lux Transfer. All rights reserved.")}</p>
        <div className="home-footer-legal" aria-label={t("Legal and privacy information")}>
          <a href={pagePath('cookies')} onClick={event => followPageLink(event, 'cookies')}>{t("Privacy Policy")}</a>
          <a href={pagePath('terms')} onClick={event => followPageLink(event, 'terms')}>{t("Booking Terms")}</a>
          <CookieSettingsButton />
        </div>
      </div>
    </footer>
  )
}
import { publicAsset } from '../lib/publicAsset'
