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
    if (responseMode === 'failure') return new Response(JSON.stringify({ error: 'Provider unavailable' }), { status: 503 })
    return new Response(JSON.stringify({ requestCode: 'EL-TEST' }), { status: 200 })
  }
  const payload = { kind: 'custom', source: 'contact', name: 'Private test name', email: 'private@example.com', phone: '+393207874212', details: 'Private test address and message', consent: true }
  const leads = () => (window.dataLayer ?? []).map(args => Array.from(args)).filter(args => args[0] === 'event' && args[1] === 'generate_lead')
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
    for (const mode of ['failure', 'invalid', 'network']) {
      responseMode = mode
      await assert.rejects(sendBooking(payload, `request-${mode}`))
      assert.equal(leads().length, 6)
    }
    responseMode = 'success'
    setAnalyticsConsent(false)
    assert.equal(await sendBooking(payload, 'request-withdrawn'), 'EL-TEST')
    assert.equal(leads().length, 6)
    assert.doesNotMatch(JSON.stringify(leads()), /Private test|private@example|393207874212|request-|mock-security|\?email=|#private/)
  } finally {
    for (const key of ['window', 'document', 'fetch']) {
      if (previous[key] === undefined) delete globalThis[key]
      else globalThis[key] = previous[key]
    }
  }
})
