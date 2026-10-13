import { company } from './company'
import { serviceOptions } from './services'
import { getLanguage, t } from '../i18n/locale'
import { pagePath, type Page } from '../types/navigation'

const pageNames: Record<Page, string> = {
  home: 'Home', services: 'Services & Prices', about: 'About Us',
  faq: 'FAQ', contact: 'Contact', cookies: 'Privacy Policy', terms: 'Booking Terms & Conditions',
}

export function pageStructuredData(page: Page, info: { title: string; description: string }) {
  const origin = company.website
  const url = `${origin}${pagePath(page)}`
  const organizationId = `${origin}/#organization`
  const websiteId = `${origin}/#website`
  const sameAs = Object.values(company.social).filter(Boolean)
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization', '@id': organizationId,
      name: company.name, alternateName: ['Easy Lux', 'EasyLuxTransfer', 'EASY LUX NCC PRIVATE TRANSFER'],
      legalName: company.legalName, url: `${origin}/`,
      description: getLanguage() === 'ru'
        ? 'Личный водитель и частные трансферы в Венеции и Тревизо: поездки из аэропортов, организация водного такси и поездки по Италии и Европе.'
        : 'Private chauffeur service based in Venice and Treviso, providing airport transfers, coordinated Water Taxi connections and journeys across Italy and Europe.',
      logo: {
        '@type': 'ImageObject', '@id': `${origin}/#logo`,
        url: `${origin}/images/brand/easy-lux-touch-icon-round.png`,
        contentUrl: `${origin}/images/brand/easy-lux-touch-icon-round.png`,
        width: 180, height: 180, caption: company.name,
      },
      email: company.email, telephone: company.phones[0].display,
      contactPoint: company.phones.map(phone => ({
        '@type': 'ContactPoint', telephone: phone.display, email: company.email,
        contactType: 'Customer service',
      })),
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite', '@id': websiteId, name: company.name,
      alternateName: ['Easy Lux', 'EasyLuxTransfer'], url: `${origin}/`,
      inLanguage: ['en', 'ru'], publisher: { '@id': organizationId },
    },
    {
      '@type': page === 'about' ? 'AboutPage' : page === 'contact' ? 'ContactPage' : page === 'services' ? 'CollectionPage' : 'WebPage',
      '@id': `${url}#webpage`, url, name: t(info.title), description: t(info.description),
      inLanguage: getLanguage(), isPartOf: { '@id': websiteId },
      about: { '@id': organizationId }, publisher: { '@id': organizationId },
      ...(page === 'services' ? { mainEntity: { '@id': `${url}#services` } } : {}),
      ...(page !== 'home' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ]
  if (page === 'services') {
    // Only describe service chapters with visible content and a real anchor.
    // Custom destination is a quote choice, rather than a separate chapter.
    const services = serviceOptions.filter(([id]) => id !== 'custom').map(([id, label]) => ({
      '@type': 'Service', '@id': `${url}#service-${id}`,
      url: `${url}#service-${id}`, name: t(label), serviceType: t(label),
      provider: { '@id': organizationId },
      mainEntityOfPage: { '@id': `${url}#webpage` },
    }))
    graph.push({
      '@type': 'ItemList', '@id': `${url}#services`, name: t(pageNames.services),
      numberOfItems: services.length,
      itemListElement: services.map((service, index) => ({
        '@type': 'ListItem', position: index + 1, item: { '@id': service['@id'] },
      })),
    }, ...services)
  }
  if (page !== 'home') graph.push({
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('Home'), item: `${origin}${pagePath('home')}` },
      { '@type': 'ListItem', position: 2, name: t(pageNames[page]), item: url },
    ],
  })
  return { '@context': 'https://schema.org', '@graph': graph }
}

// Escape characters that could end an inline script in prerendered HTML.
export const structuredDataJson = (page: Page, info: { title: string; description: string }) =>
  JSON.stringify(pageStructuredData(page, info)).replace(/</g, '\\u003c')
