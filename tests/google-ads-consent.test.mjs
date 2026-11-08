import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'

test('Ads shares one loader, requires both permissions and configures once across consent changes', async () => {
  const previous = { window: globalThis.window, document: globalThis.document }
  try {
    for (const hostname of ['easyluxtransfer.com', 'www.easyluxtransfer.com', 'localhost', '127.0.0.1', 'easyluxtransfer.pages.dev']) {
      const scripts = []
      globalThis.window = { location: { hostname, href: `https://${hostname}/?email=private@example.com&gclid=Click_123#private` } }
      globalThis.document = {
        title: 'Home', referrer: 'https://example.com/?email=private@example.com#private',
        createElement: () => ({ remove() { scripts.splice(scripts.indexOf(this), 1) } }),
        head: { appendChild: script => scripts.push(script) },
      }
      const analytics = await import(typescriptModule(new URL('../src/lib/analytics.ts', import.meta.url)) + `#ads-${hostname}`)
      const commands = () => (window.dataLayer ?? []).map(args => Array.from(args))
      const adsConfigs = () => commands().filter(args => args[0] === 'config' && args[1] === 'AW-18563579918')
      const conversions = () => commands().filter(args => args[0] === 'event' && args[1] === 'conversion')
      analytics.setAnalyticsConsent(false, true)
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'before-consent')
      assert.equal(scripts.length, 0)
      analytics.setAnalyticsConsent(true, false)
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'analytics-only')
      assert.equal(adsConfigs().length, 0)
      analytics.setAnalyticsConsent(true, true)
      analytics.setAnalyticsConsent(true, true)
      analytics.trackAnalyticsPage()
      analytics.trackWhatsAppClick('https://wa.me/393202416662', 'footer')
      assert.equal(conversions().length, 0, 'Consent, page views and WhatsApp clicks never convert')
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'before-consent')
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'analytics-only')
      assert.equal(conversions().length, 0, 'Never replay an earlier successful request after opt-in')
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'new-request')
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'new-request')
      const production = ['easyluxtransfer.com', 'www.easyluxtransfer.com'].includes(hostname)
      assert.equal(scripts.length, production ? 1 : 0)
      assert.equal(adsConfigs().length, production ? 1 : 0)
      assert.equal(conversions().length, production ? 1 : 0)
      if (!production) { assert.deepEqual(commands(), []); continue }
      assert.equal(scripts[0].src, '/5tpj/')
      assert.equal(adsConfigs()[0][2].send_page_view, false)
      assert.equal(adsConfigs()[0][2].allow_ad_personalization_signals, false)
      assert.equal(conversions()[0][2].page_location, `https://${hostname}/?gclid=Click_123`)
      assert.equal(conversions()[0][2].page_referrer, 'https://example.com/')
      assert.equal(commands().filter(args => args[0] === 'config' && args[1] === 'G-M322BVXRJG').length, 1)
      assert.equal(commands().filter(args => args[0] === 'consent' && args[1] === 'update').at(-1)[2].ad_personalization, 'denied')
      analytics.setAnalyticsConsent(true, false)
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'withdrawn-request')
      analytics.setAnalyticsConsent(true, true)
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'withdrawn-request')
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'new-request')
      assert.equal(conversions().length, 1)
      assert.equal(adsConfigs().length, 1, 'Consent synchronization must not configure Ads twice')
      analytics.setAnalyticsConsent(false, true)
      analytics.trackGoogleAdsLead('home-booking', 'transfer', 'analytics-withdrawn')
      assert.equal(conversions().length, 1)
      analytics.setAnalyticsConsent(true, true)
      analytics.trackGoogleAdsLead('invalid', 'transfer', 'invalid-source')
      analytics.trackGoogleAdsLead('contact', 'invalid', 'invalid-kind')
      analytics.trackGoogleAdsLead('contact', 'custom', '')
      assert.equal(conversions().length, 1)
      assert.doesNotMatch(JSON.stringify(commands()), /email=|private@example|#private|new-request|withdrawn-request/)
      scripts[0].onerror()
      analytics.setAnalyticsConsent(true, true)
      assert.equal(scripts.length, 1)
      assert.equal(adsConfigs().length, 1, 'A failed loader resets destination initialization for retry')
    }
  } finally {
    for (const key of ['window', 'document']) {
      if (previous[key] === undefined) delete globalThis[key]
      else globalThis[key] = previous[key]
    }
  }
})
