import { company } from '../config/company'

export const analyticsMeasurementId = 'G-M322BVXRJG'
export const googleAdsTagId = 'AW-18563579918'
export const googleAdsLeadDestination = `${googleAdsTagId}/mblgCO3uvrQdEI6A55NF`
const scriptId = 'easylux-google-analytics'
const analyticsHosts = new Set(['easyluxtransfer.com', 'www.easyluxtransfer.com'])
let initialized = false
let allowed = false
let advertisingAllowed = false
let advertisingInitialized = false
let lastPage = ''
const measuredRequests = new Set<string>()
const advertisingRequests = new Set<string>()
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

/** Preserve only advertising click IDs, and only with the separate advertising permission. */
function measurementPageUrl(value: string): string {
  const page = analyticsPageUrl(value)
  if (!page || !advertisingAllowed) return page
  const source = new URL(value)
  const result = new URL(page)
  for (const key of ['gclid', 'gbraid', 'wbraid']) {
    const id = source.searchParams.get(key)
    if (id && /^[A-Za-z0-9_-]{1,512}$/.test(id)) result.searchParams.set(key, id)
  }
  return result.href
}

/** Add Ads to the existing Google tag only after explicit advertising permission. */
function configureGoogleAds() {
  if (!advertisingAllowed || advertisingInitialized || typeof window.gtag !== 'function') return
  window.gtag('config', googleAdsTagId, {
    send_page_view: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 180 * 24 * 60 * 60,
    page_location: measurementPageUrl(window.location.href),
    page_referrer: analyticsPageUrl(document.referrer),
  })
  advertisingInitialized = true
}

export function setAnalyticsConsent(consented: boolean, advertisingConsented = false) {
  if (typeof window === 'undefined') return
  // Local development and preview hosts must never send to production Analytics.
  allowed = consented && analyticsHosts.has(window.location.hostname)
  // Ads measurement uses consented Analytics activity; it never enables Analytics itself.
  advertisingAllowed = allowed && advertisingConsented
  window['ga-disable-G-M322BVXRJG'] = !allowed
  const consent = {
    analytics_storage: allowed ? 'granted' : 'denied',
    ad_storage: advertisingAllowed ? 'granted' : 'denied',
    ad_user_data: advertisingAllowed ? 'granted' : 'denied',
    ad_personalization: 'denied',
  }
  const updateConsent = () => {
    window.gtag?.('set', 'ads_data_redaction', !advertisingAllowed)
    window.gtag?.('set', { page_location: measurementPageUrl(window.location.href), page_referrer: analyticsPageUrl(document.referrer) })
    window.gtag?.('consent', 'update', consent)
  }
  if (!allowed) {
    if (initialized) updateConsent()
    lastPage = ''
    return
  }
  if (initialized) {
    updateConsent()
    configureGoogleAds()
    return
  }
  initialized = true
  window.dataLayer = window.dataLayer || []
  // gtag.js expects the Arguments object, as in Google's installation snippet.
  window.gtag = function () { window.dataLayer!.push(arguments) }
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  })
  updateConsent()
  window.gtag('set', 'url_passthrough', false)
  window.gtag('js', new Date())
  window.gtag('config', analyticsMeasurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 180 * 24 * 60 * 60,
    page_location: measurementPageUrl(window.location.href),
    page_referrer: analyticsPageUrl(document.referrer),
  })
  configureGoogleAds()
  const script = document.createElement('script')
  script.id = scriptId
  script.async = true
  // The reserved Cloudflare route serves this tag and its measurement requests on our domain.
  script.src = '/5tpj/'
  script.onerror = () => {
    script.remove()
    initialized = false
    advertisingInitialized = false
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
  const location = measurementPageUrl(window.location.href)
  window.gtag?.('set', { page_location: location, page_title: document.title, page_referrer: referrer })
  window.gtag?.('event', 'page_view', {
    send_to: analyticsMeasurementId, page_location: location, page_title: document.title, page_referrer: referrer,
  })
}

function trackInteraction(name: 'generate_lead' | 'contact_whatsapp', parameters: Record<string, string>): boolean {
  if (!allowed || !initialized || typeof window === 'undefined' || typeof window.gtag !== 'function') return false
  try {
    window.gtag('event', name, {
      send_to: analyticsMeasurementId,
      page_location: measurementPageUrl(window.location.href),
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

/** Called at confirmed API success, alongside GA4; never replay a past consent decision. */
export function trackGoogleAdsLead(source: typeof leadSources[number], kind: typeof leadKinds[number], requestId: string) {
  if (!leadSources.includes(source) || !leadKinds.includes(kind) || !requestId || advertisingRequests.has(requestId)) return
  // Record the successful submission even if measurement is declined or unavailable.
  // A retry or later opt-in must not convert the same enquiry again.
  advertisingRequests.add(requestId)
  if (!advertisingAllowed || !initialized || !advertisingInitialized || typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', 'conversion', {
      send_to: googleAdsLeadDestination,
      value: 1.0,
      currency: 'EUR',
      page_location: measurementPageUrl(window.location.href),
      page_referrer: analyticsPageUrl(document.referrer),
    })
  } catch {
    // Optional Ads measurement must never change a successful booking result.
  }
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

function clearMeasurementCookies(matches: (name: string) => boolean) {
  if (typeof document === 'undefined') return
  const parts = window.location.hostname.split('.')
  const domains = ['', ...parts.map((_, index) => parts.slice(index).join('.')).filter(domain => domain.includes('.'))]
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (!matches(name)) continue
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`
  }
}

export function clearAnalyticsCookies() {
  clearMeasurementCookies(name => name === '_ga' || name.startsWith('_ga_'))
}

export function clearAdvertisingCookies() {
  clearMeasurementCookies(name => name.startsWith('_gcl_') || name === '_gac_gb' || name.startsWith('_gac_gb_'))
}
