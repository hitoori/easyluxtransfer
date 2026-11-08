import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
after(() => server.close())
const { sendBooking } = await server.ssrLoadModule('/src/lib/sendBooking.ts')
const { setAnalyticsConsent } = await server.ssrLoadModule('/src/lib/analytics.ts')

test('all request sources measure only confirmed API success; errors, retries and rejection of Analytics preserve submission behavior', async () => {
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch }
  let callback
  let responseMode = 'success'
  const node = () => ({ setAttribute() {}, addEventListener() {}, append() {}, showModal() {}, close() {}, remove() {} })
  globalThis.window = {
    location: { hostname: 'easyluxtransfer.com', href: 'https://easyluxtransfer.com/contact?email=private@example.com#private' },
    setTimeout, clearTimeout,
    turnstile: {
      render(_element, options) { callback = options.callback; return 'test-widget' },
      execute() { callback('mock-security-token') },
      remove() {},
    },
  }
  globalThis.document = { createElement: node, body: { append() {} }, head: { appendChild() {} }, referrer: '' }
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body)
    assert.equal(payload.turnstileToken, 'mock-security-token')
    if (responseMode === 'network') throw new Error('Network unavailable')
    if (responseMode === 'invalid') return new Response('{}', { status: 200 })
    if (responseMode === 'honeypot') return new Response(JSON.stringify({ ok: true, requestCode: '' }), { status: 200 })
    if (responseMode === 'validation') return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
    if (responseMode === 'security') return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 403 })
    if (responseMode === 'failure') return new Response(JSON.stringify({ error: 'Provider unavailable' }), { status: 503 })
    return new Response(JSON.stringify({ requestCode: 'EL-TEST' }), { status: 200 })
  }
  const payload = { kind: 'custom', source: 'contact', name: 'Private test name', email: 'private@example.com', phone: '+393207874212', details: 'Private test address and message', consent: true }
  const leads = () => (window.dataLayer ?? []).map(args => Array.from(args)).filter(args => args[0] === 'event' && args[1] === 'generate_lead')
  const conversions = () => (window.dataLayer ?? []).map(args => Array.from(args)).filter(args => args[0] === 'event' && args[1] === 'conversion')
  try {
    setAnalyticsConsent(false)
    assert.equal(await sendBooking(payload, 'request-no-consent'), 'EL-TEST')
    assert.equal(leads().length, 0)
    setAnalyticsConsent(true)
    assert.equal(leads().length, 0, 'No replay after Analytics opt-in')
    for (const [source, kind] of [['home-booking', 'transfer'], ['home-booking', 'hourly'], ['home-booking', 'tours'], ['home-quote', 'custom'], ['services-quote', 'transfer'], ['contact', 'custom']]) {
      const id = `request-${source}-${kind}`
      assert.equal(await sendBooking({ ...payload, source, kind }, id), 'EL-TEST')
      assert.equal(await sendBooking({ ...payload, source, kind }, id), 'EL-TEST')
    }
    assert.equal(leads().length, 6)
    assert.equal(conversions().length, 0, 'Analytics permission alone never grants Ads measurement')
    setAnalyticsConsent(true, true)
    assert.equal(conversions().length, 0, 'Advertising opt-in does not replay prior requests')
    await sendBooking(payload, 'request-contact-custom')
    assert.equal(conversions().length, 0, 'Retrying an Analytics-only request after opt-in must not create an Ads conversion')
    for (const [source, kind] of [['home-booking', 'transfer'], ['home-booking', 'hourly'], ['home-booking', 'tours'], ['home-quote', 'custom'], ['services-quote', 'transfer'], ['contact', 'custom']]) {
      const id = `ads-request-${source}-${kind}`
      await sendBooking({ ...payload, source, kind }, id)
      await sendBooking({ ...payload, source, kind }, id)
    }
    assert.equal(leads().length, 12)
    assert.equal(conversions().length, 6, 'Repeated requests count once per successful submission')
    for (const [, , parameters] of conversions()) {
      assert.deepEqual(parameters, {
        send_to: 'AW-18563579918/mblgCO3uvrQdEI6A55NF', value: 1.0, currency: 'EUR',
        page_location: 'https://easyluxtransfer.com/contact', page_referrer: '',
      })
    }
    for (const mode of ['failure', 'invalid', 'network', 'validation', 'security', 'honeypot']) {
      responseMode = mode
      await assert.rejects(sendBooking(payload, `request-${mode}`))
      assert.equal(leads().length, 12)
      assert.equal(conversions().length, 6)
    }
    responseMode = 'success'
    await sendBooking(payload, 'request-failure')
    await sendBooking(payload, 'request-failure')
    assert.equal(leads().length, 13)
    assert.equal(conversions().length, 7, 'A failed attempt can later succeed and count exactly once')
    setAnalyticsConsent(true, false)
    await sendBooking(payload, 'request-ads-withdrawn')
    assert.equal(leads().length, 14)
    assert.equal(conversions().length, 7)
    setAnalyticsConsent(true, true)
    await sendBooking(payload, 'request-ads-withdrawn')
    assert.equal(conversions().length, 7, 'Regranting Ads does not replay declined requests')
    const originalTag = window.gtag
    window.gtag = (...args) => { if (args[1] === 'conversion') throw Error('Ads blocked'); originalTag(...args) }
    assert.equal(await sendBooking(payload, 'request-ads-blocked'), 'EL-TEST')
    assert.equal(leads().length, 15, 'Ads failure cannot interrupt GA4 or the booking result')
    window.gtag = (...args) => { if (args[1] === 'generate_lead') throw Error('GA4 blocked'); originalTag(...args) }
    assert.equal(await sendBooking(payload, 'request-ga4-blocked'), 'EL-TEST')
    assert.equal(conversions().length, 8, 'GA4 failure cannot suppress the separate Ads conversion')
    window.gtag = originalTag
    setAnalyticsConsent(false)
    assert.equal(await sendBooking(payload, 'request-withdrawn'), 'EL-TEST')
    assert.equal(leads().length, 15)
    assert.equal(conversions().length, 8)
    assert.doesNotMatch(JSON.stringify([...leads(), ...conversions()]), /Private test|private@example|393207874212|request-|mock-security|\?email=|#private/)
  } finally {
    for (const key of ['window', 'document', 'fetch']) {
      if (previous[key] === undefined) delete globalThis[key]
      else globalThis[key] = previous[key]
    }
  }
})
