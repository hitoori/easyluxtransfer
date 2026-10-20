import type { Page } from '../types/navigation'
import { pagePath } from '../types/navigation'
import { imageAttributes, publicAsset } from '../lib/publicAsset'
import { getLanguage, t, type Language } from '../i18n/locale'
import { company } from './company'
import { structuredDataJson } from './structuredData'

export const siteOrigin = company.website
export const pageMetadata: Record<Page, { title: string; description: string; image: string; imageAlt: string }> = {
  home: { title: 'Venice & Treviso Private Transfers | Easy Lux Transfer', description: 'Private transfers in Venice and Treviso. Pick-ups at airports, train stations, hotels or your chosen address, with journeys across Italy and Europe.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Boats on Venice Grand Canal' },
  services: { title: 'Venice & Treviso Transfers & Prices | Easy Lux Transfer', description: 'Private transfers and chauffeur services (NCC) in Venice and Treviso. Airport, station, hotel and address pick-ups, with indicative prices and custom quotes.', image: 'images/services/venice-dolomites-transfer.png', imageAlt: 'Private chauffeur transfer in Italy' },
  about: { title: 'About Easy Lux Transfer | Venice Chauffeur Service', description: 'Meet Easy Lux Transfer, providing private transfers and chauffeur services (NCC) in Venice and Treviso. Learn about our team and vehicle options.', image: 'images/about/airport-transfer-van.png', imageAlt: 'Private transfer van at an airport' },
  faq: { title: 'Venice & Treviso Transfer FAQ | Easy Lux Transfer', description: 'Answers about private transfers in Venice and Treviso: airport, hotel and station pick-ups, luggage, quotes, payments and booking changes.', image: 'images/home/vehicle/black-private-van-venice.png', imageAlt: 'Black private transfer van in Venice' },
  contact: { title: 'Venice & Treviso Transfer Quote | Easy Lux Transfer', description: 'Request a private transfer quote in Venice or Treviso. Share your pick-up address, destination, date, passengers and luggage. We’ll confirm availability.', image: 'images/home/hero/venice-grand-canal.jpg', imageAlt: 'Venice Grand Canal and waterfront architecture' },
  cookies: { title: 'Privacy & Cookie Policy | Easy Lux Transfer', description: 'Read the Easy Lux Transfer Privacy and Cookie Policy. Learn how enquiry details are handled and manage Google Analytics and address suggestion preferences.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Venice Grand Canal' },
  terms: { title: 'Transfer Booking Terms | Easy Lux Transfer', description: 'Read Easy Lux Transfer booking terms: deposits, balance paid to your driver after the journey, changes and the 24-hour cancellation and refund policy.', image: 'images/home/hero/venice-canal-boats.jpg', imageAlt: 'Venice Grand Canal' },
}

export function metadataTags(page: Page) {
  const info = pageMetadata[page]
  const url = `${siteOrigin}${pagePath(page)}`
  const image = imageAttributes(publicAsset(info.image))
  return {
    description: t(info.description),
    robots: 'index, follow, max-image-preview:large',
    'og:type': 'website', 'og:site_name': 'Easy Lux Transfer', 'og:locale': getLanguage() === 'ru' ? 'ru_RU' : 'en_GB',
    'og:locale:alternate': getLanguage() === 'ru' ? 'en_GB' : 'ru_RU',
    'og:title': t(info.title), 'og:description': t(info.description), 'og:url': url,
    'og:image': new URL(publicAsset(info.image), siteOrigin).href, 'og:image:alt': t(info.imageAlt),
    ...(image.width && image.height ? { 'og:image:width': String(image.width), 'og:image:height': String(image.height) } : {}),
    'twitter:card': 'summary_large_image', 'twitter:title': t(info.title),
    'twitter:description': t(info.description), 'twitter:image': new URL(publicAsset(info.image), siteOrigin).href,
    'twitter:image:alt': t(info.imageAlt),
  }
}

export function updatePageMetadata(page: Page) {
  document.documentElement.lang = getLanguage()
  document.title = t(pageMetadata[page].title)
  let structuredData = document.querySelector<HTMLScriptElement>('#site-structured-data')
  if (!structuredData) {
    structuredData = document.createElement('script')
    structuredData.id = 'site-structured-data'
    structuredData.type = 'application/ld+json'
    document.head.append(structuredData)
  }
  structuredData.textContent = structuredDataJson(page, pageMetadata[page])
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
  document.querySelector('#site-structured-data')?.remove()
}
