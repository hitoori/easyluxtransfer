import type { Page } from '../types/navigation'
import { pagePath } from '../types/navigation'
import { publicAsset } from '../lib/publicAsset'
import { getLanguage, t, type Language } from '../i18n/locale'

export const siteOrigin = 'https://easyluxtransfer.com'
export const pageMetadata: Record<Page, { title: string; description: string; image: string; imageAlt: string }> = {
  home: { title: 'Venice & Treviso Private Transfers | Easy Lux Transfer', description: 'Private transfers from Venice and Treviso, airport pick-ups and Water Taxi connections. Travel across Italy and Europe with Easy Lux Transfer.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Boats on Venice Grand Canal' },
  services: { title: 'Venice Transfer Services & Prices | Easy Lux Transfer', description: 'Explore Easy Lux Transfer services and indicative fares for airports, Water Taxi connections, hourly chauffeurs, Italy, Europe and cruise ports.', image: 'images/services/venice-dolomites-transfer.png', imageAlt: 'Private chauffeur transfer in Italy' },
  about: { title: 'About Our Chauffeur Service | Easy Lux Transfer', description: 'Meet the founders of Easy Lux Transfer and discover their approach to private chauffeur travel, with professionalism, punctuality and personal care.', image: 'images/about/airport-transfer-van.png', imageAlt: 'Private transfer van at an airport' },
  faq: { title: 'Transfer Booking FAQ | Easy Lux Transfer', description: 'Find answers from Easy Lux Transfer about quotes, booking confirmation, deposits, airport pick-ups, luggage and Water Taxi connections in Venice.', image: 'images/home/vehicle/black-private-van-venice.png', imageAlt: 'Black private transfer van in Venice' },
  contact: { title: 'Contact & Transfer Quotes | Easy Lux Transfer', description: 'Contact Easy Lux Transfer for a private journey from Venice or Treviso. Share your route and date for airport, Water Taxi or long-distance quotes.', image: 'images/home/hero/venice-grand-canal.jpg', imageAlt: 'Venice Grand Canal and waterfront architecture' },
  cookies: { title: 'Privacy Policy | Easy Lux Transfer', description: 'Learn how Easy Lux Transfer handles contact details, journey requests and optional services, and how to manage your privacy and cookie preferences.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Venice Grand Canal' },
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
