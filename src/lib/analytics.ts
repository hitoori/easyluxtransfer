import { company } from '../config/company'

export const analyticsMeasurementId = 'G-M322BVXRJG'
const scriptId = 'easylux-google-analytics'
let initialized = false
let allowed = false
let lastPage = ''
const measuredRequests = new Set<string>()
const leadSources = ['home-booking', 'home-quote', 'services-quote', 'contact'] as const
const leadKinds = ['transfer', 'hourly', 'tours', 'custom'] as const
const linkLocations = ['footer', 'contact', 'faq', 'other'] as const

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    'ga-disable-G-M322BVXRJG'?: boolean
  }
}

/** Exclude URL parameters/fragments that might contain enquiry or contact details. */
export function analyticsPageUrl(value: string): string {
  try { const url = new URL(value); return `${url.origin}${url.pathname}` } catch { return '' }
}

export function setAnalyticsConsent(consented: boolean) {
  if (typeof window === 'undefined') return
  allowed = consented
  window['ga-disable-G-M322BVXRJG'] = !consented
  if (!consented) {
    if (initialized) window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
    lastPage = ''
    return
  }
  if (initialized) {
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
    return
  }
  initialized = true
  window.dataLayer = window.dataLayer || []
  // gtag.js expects the Arguments object, as in Google's installation snippet.
  window.gtag = function () { window.dataLayer!.push(arguments) }
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  })
  window.gtag('consent', 'update', { analytics_storage: 'granted' })
  window.gtag('js', new Date())
  window.gtag('config', analyticsMeasurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 180 * 24 * 60 * 60,
    page_location: analyticsPageUrl(window.location.href),
    page_referrer: analyticsPageUrl(document.referrer),
  })
  const script = document.createElement('script')
  script.id = scriptId
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`
  script.onerror = () => {
    script.remove()
    initialized = false
    lastPage = ''
    window.dataLayer = []
  }
  document.head.appendChild(script)
}

export function trackAnalyticsPage() {
  if (!allowed || !initialized || typeof window === 'undefined') return
  const page = analyticsPageUrl(window.location.href)
  if (!page || page === lastPage) return
  const referrer = lastPage || analyticsPageUrl(document.referrer)
  lastPage = page
  window.gtag?.('set', { page_location: page, page_title: document.title, page_referrer: referrer })
  window.gtag?.('event', 'page_view', {
    send_to: analyticsMeasurementId, page_location: page, page_title: document.title, page_referrer: referrer,
  })
}

function trackInteraction(name: 'generate_lead' | 'contact_whatsapp', parameters: Record<string, string>): boolean {
  if (!allowed || !initialized || typeof window === 'undefined' || typeof window.gtag !== 'function') return false
  try {
    window.gtag('event', name, {
      send_to: analyticsMeasurementId,
      page_location: analyticsPageUrl(window.location.href),
      ...parameters,
    })
    return true
  } catch {
    // Optional measurement must never interrupt a request or contact link.
    return false
  }
}

/** Called only after the booking API confirms success. Never send form fields or IDs. */
export function trackAnalyticsLead(source: typeof leadSources[number], kind: typeof leadKinds[number], requestId: string) {
  if (!leadSources.includes(source) || !leadKinds.includes(kind) || !requestId || measuredRequests.has(requestId)) return
  if (trackInteraction('generate_lead', { form_name: source, service_type: kind })) measuredRequests.add(requestId)
}

/** Measure a company WhatsApp link separately from a submitted enquiry. */
export function trackWhatsAppClick(href: string, location: typeof linkLocations[number]) {
  if (!linkLocations.includes(location)) return
  try {
    const url = new URL(href)
    const isCompanyLink = company.phones.some(phone => {
      const configured = new URL(phone.whatsapp)
      return url.origin === configured.origin && url.pathname === configured.pathname
    })
    if (isCompanyLink) trackInteraction('contact_whatsapp', { contact_method: 'whatsapp', link_location: location })
  } catch { /* Ignore unrelated or invalid URLs without changing link behavior. */ }
}

export function analyticsLoaded(): boolean {
  return typeof document !== 'undefined' && Boolean(document.getElementById(scriptId))
}

export function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return
  const parts = window.location.hostname.split('.')
  const domains = ['', ...parts.map((_, index) => parts.slice(index).join('.')).filter(domain => domain.includes('.'))]
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (name !== '_ga' && !name.startsWith('_ga_')) continue
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`
  }
}
