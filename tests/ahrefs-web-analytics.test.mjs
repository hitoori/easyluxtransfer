import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'

async function browser(host = 'easyluxtransfer.com', referrer = '') {
  const previous = { window: globalThis.window, document: globalThis.document }
  const scripts = []
  const events = []
  globalThis.window = { location: { hostname: host, href: `https://${host}/?email=private@example.com#secret` } }
  globalThis.document = {
    referrer,
    getElementById: id => scripts.find(script => script.id === id),
    createElement: () => ({ attrs: {}, setAttribute(name, value) { this.attrs[name] = value }, remove() { scripts.splice(scripts.indexOf(this), 1) } }),
    head: { appendChild: script => scripts.push(script) },
  }
  const analytics = await import(typescriptModule(new URL('../src/lib/ahrefsAnalytics.ts', import.meta.url)) + `#${Math.random()}`)
  return { analytics, scripts, events, ready() { window.AhrefsAnalytics = { sendEvent: name => events.push({ name, url: scripts[0].attrs['data-page-location'] }) }; scripts[0].onload() }, restore() { for (const key of ['window', 'document']) { if (previous[key] === undefined) delete globalThis[key]; else globalThis[key] = previous[key] } } }
}

test('Ahrefs loads once after permission and sends only clean, distinct public pageviews', async () => {
  const b = await browser()
  try {
    b.analytics.setAhrefsAnalyticsConsent(false)
    assert.equal(b.scripts.length, 0)
    b.analytics.setAhrefsAnalyticsConsent(true)
    b.analytics.setAhrefsAnalyticsConsent(true)
    assert.equal(b.scripts.length, 1)
    assert.equal(b.scripts[0].src, 'https://analytics.ahrefs.com/analytics.js')
    assert.equal(b.scripts[0].attrs['data-key'], 'xnCS3XrGrmww2W0GIIHtFA')
    assert.equal(b.scripts[0].attrs['data-no-pageview-auto'], '')
    b.ready()
    b.analytics.trackAhrefsPage()
    window.location.href = 'https://easyluxtransfer.com/ru/services?phone=private#private'
    b.analytics.trackAhrefsPage()
    assert.deepEqual(b.events, [{ name: 'pageview', url: 'https://easyluxtransfer.com/' }, { name: 'pageview', url: 'https://easyluxtransfer.com/ru/services' }])
    b.analytics.setAhrefsAnalyticsConsent(false)
    window.location.href = 'https://easyluxtransfer.com/contact'
    b.analytics.trackAhrefsPage()
    assert.equal(b.events.length, 2)
  } finally { b.restore() }
})

test('localhost, preview hosts, sensitive referrers and unknown paths never load Ahrefs', async () => {
  for (const [host, referrer, path] of [
    ['localhost', '', '/'], ['127.0.0.1', '', '/'], ['preview.example', '', '/'],
    ['easyluxtransfer.com', 'https://easyluxtransfer.com/?email=private', '/'],
    ['easyluxtransfer.com', 'https://easyluxtransfer.com/#private', '/'],
    ['easyluxtransfer.com', '', '/api/booking'],
  ]) {
    const b = await browser(host, referrer)
    try {
      window.location.href = `https://${host}${path}`
      b.analytics.setAhrefsAnalyticsConsent(true)
      assert.equal(b.scripts.length, 0)
    } finally { b.restore() }
  }
})

test('failed script download can retry and late load after withdrawal sends no pageview', async () => {
  const b = await browser()
  try {
    b.analytics.setAhrefsAnalyticsConsent(true)
    b.scripts[0].onerror()
    assert.equal(b.scripts.length, 0)
    b.analytics.setAhrefsAnalyticsConsent(true)
    b.analytics.setAhrefsAnalyticsConsent(false)
    b.ready()
    assert.equal(b.events.length, 0)
  } finally { b.restore() }
})

test('updated consent accepts version 4 while preserving earlier Google-only choices', async () => {
  const { readStoredConsent } = await import(typescriptModule(new URL('../src/lib/consentStorage.ts', import.meta.url)))
  for (const version of [3, 4]) {
    const choice = { version, maps: false, analytics: true, advertising: false, savedAt: 900 }
    assert.deepEqual(readStoredConsent({ getItem: () => JSON.stringify(choice) }, 1000), choice)
  }
})
