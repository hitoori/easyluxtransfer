import type { Page } from '../types/navigation'
import { pagePath } from '../types/navigation'
import { publicAsset } from '../lib/publicAsset'
import { getLanguage, t, type Language } from '../i18n/locale'

export const siteOrigin = 'https://easyluxtransfer.com'
export const pageMetadata: Record<Page, { title: string; description: string; image: string; imageAlt: string }> = {
  home: { title: 'Venice & Treviso Airport Transfers | Easy Lux Transfer', description: 'Private airport transfers from Venice Marco Polo and Treviso with Easy Lux Transfer. Travel to hotels, cruise ports and destinations across Italy and Europe.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Boats on Venice Grand Canal' },
  services: { title: 'Venice Private Transfers & Prices | Easy Lux Transfer', description: 'Explore Easy Lux Transfer services and indicative prices: Venice and Treviso airport transfers, Water Taxi connections, cruise ports and hourly chauffeurs.', image: 'images/services/venice-dolomites-transfer.png', imageAlt: 'Private chauffeur transfer in Italy' },
  about: { title: 'About Easy Lux Transfer | Venice Chauffeur Service', description: 'Meet Easy Lux Transfer, a private chauffeur service based in Venice and Treviso. Discover our founders and approach to personal travel across Italy and Europe.', image: 'images/about/airport-transfer-van.png', imageAlt: 'Private transfer van at an airport' },
  faq: { title: 'Venice Transfer & Booking FAQ | Easy Lux Transfer', description: 'Planning a Venice or Treviso transfer? Easy Lux Transfer answers questions about airport pick-ups, luggage, deposits, Water Taxi and cancellations.', image: 'images/home/vehicle/black-private-van-venice.png', imageAlt: 'Black private transfer van in Venice' },
  contact: { title: 'Venice Transfer Quote & Contact | Easy Lux Transfer', description: 'Request a private transfer quote from Easy Lux Transfer. Share your Venice or Treviso airport, hotel or cruise port route, date and passenger details.', image: 'images/home/hero/venice-grand-canal.jpg', imageAlt: 'Venice Grand Canal and waterfront architecture' },
  cookies: { title: 'Privacy & Cookie Policy | Easy Lux Transfer', description: 'Read the Easy Lux Transfer Privacy and Cookie Policy. Learn how enquiry details are handled and manage Google Analytics and address suggestion preferences.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Venice Grand Canal' },
  terms: { title: 'Transfer Booking Terms | Easy Lux Transfer', description: 'Read Easy Lux Transfer booking terms: deposits, balance paid to your driver after the journey, changes and the 24-hour cancellation and refund policy.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Venice Grand Canal' },
}

export function metadataTags(page: Page) {
  const info = pageMetadata[page]
  const url = `${siteOrigin}${pagePath(page)}`
  return {
    description: t(info.description),
    robots: 'index, follow, max-image-preview:large',
    'og:type': 'website', 'og:site_name': 'Easy Lux Transfer', 'og:locale': getLanguage() === 'ru' ? 'ru_RU' : 'en_GB',
    'og:title': t(info.title), 'og:description': t(info.description), 'og:url': url,
    'og:image': new URL(publicAsset(info.image), siteOrigin).href, 'og:image:alt': t(info.imageAlt),
    'twitter:card': 'summary_large_image', 'twitter:title': t(info.title),
    'twitter:description': t(info.description), 'twitter:image': new URL(publicAsset(info.image), siteOrigin).href,
    'twitter:image:alt': t(info.imageAlt),
  }
}

export function updatePageMetadata(page: Page) {
  document.documentElement.lang = getLanguage()
  document.title = t(pageMetadata[page].title)
  for (const [name, content] of Object.entries(metadataTags(page))) {
    const attribute = name.startsWith('og:') ? 'property' : 'name'
    let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, name); document.head.append(meta) }
    meta.content = content
  }
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
  canonical.href = `${siteOrigin}${pagePath(page)}`
  for (const language of ['en', 'ru', 'x-default'] as const) {
    let alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${language}"]`)
    if (!alternate) { alternate = document.createElement('link'); alternate.rel = 'alternate'; alternate.hreflang = language; document.head.append(alternate) }
    alternate.href = `${siteOrigin}${pagePath(page, language === 'x-default' ? 'en' : language)}`
  }
}

export const alternateLinks = (page: Page) => (['en', 'ru', 'x-default'] as const).map(language => `<link rel="alternate" hreflang="${language}" href="${siteOrigin}${pagePath(page, (language === 'x-default' ? 'en' : language) as Language)}" />`).join('\n')

export function updateNotFoundMetadata() {
  document.documentElement.lang = getLanguage()
  document.title = getLanguage() === 'ru' ? 'Страница не найдена | Easy Lux Transfer' : 'Page not found | Easy Lux Transfer'
  let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
  robots.content = 'noindex, follow'
  document.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach(link => link.remove())
}
