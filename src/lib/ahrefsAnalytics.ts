const scriptId = 'easylux-ahrefs-analytics'
const productionHosts = new Set(['easyluxtransfer.com', 'www.easyluxtransfer.com'])
const publicPaths = new Set(['/', '/services', '/about', '/contact', '/faq', '/cookies', '/terms', '/ru', '/ru/services', '/ru/about', '/ru/contact', '/ru/faq', '/ru/cookies', '/ru/terms'])
let allowed = false
let lastPage = ''

declare global {
  interface Window {
    AhrefsAnalytics?: { sendEvent: (name: string) => void }
  }
}

function currentPage(): string {
  const url = new URL(window.location.href)
  return productionHosts.has(url.hostname) && publicPaths.has(url.pathname) ? `${url.origin}${url.pathname}` : ''
}

export function ahrefsAnalyticsLoaded(): boolean {
  return typeof document !== 'undefined' && Boolean(document.getElementById(scriptId))
}

export function setAhrefsAnalyticsConsent(consented: boolean) {
  if (typeof window === 'undefined') return
  allowed = consented && productionHosts.has(window.location.hostname)
  if (!allowed) { lastPage = ''; return }
  const page = currentPage()
  if (!page || ahrefsAnalyticsLoaded()) return
  // The vendor reads document.referrer directly. Skip measurement when it could
  // contain a previous page's enquiry details; never transmit those parameters.
  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer)
      if (referrer.search || referrer.hash) return
    } catch { return }
  }
  const script = document.createElement('script')
  script.id = scriptId
  script.src = 'https://analytics.ahrefs.com/analytics.js'
  script.async = true
  script.setAttribute('data-key', 'xnCS3XrGrmww2W0GIIHtFA')
  script.setAttribute('data-page-location', page)
  script.setAttribute('data-no-pageview-auto', '')
  script.referrerPolicy = 'no-referrer'
  script.onload = () => trackAhrefsPage()
  script.onerror = () => { script.remove(); lastPage = '' }
  document.head.appendChild(script)
}

export function trackAhrefsPage() {
  if (!allowed || typeof window === 'undefined' || !window.AhrefsAnalytics) return
  const page = currentPage()
  const script = document.getElementById(scriptId)
  if (!page || page === lastPage || !script) return
  script.setAttribute('data-page-location', page)
  try {
    window.AhrefsAnalytics.sendEvent('pageview')
    lastPage = page
  } catch { /* Optional statistics must never interrupt navigation. */ }
}
