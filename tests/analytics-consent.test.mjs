import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'

const storage = await import(typescriptModule(new URL('../src/lib/consentStorage.ts', import.meta.url)))
const read = (data, now = 1000) => storage.readStoredConsent({ getItem: () => JSON.stringify(data) }, now)

test('old Maps acceptance does not grant Analytics consent; version 2 validates each preference', () => {
  assert.deepEqual(read({ version: 1, maps: true, analytics: true, savedAt: 900 }), { version: 1, maps: true, analytics: false, savedAt: 900 })
  assert.equal(read({ version: 2, maps: false, analytics: true, savedAt: 900 }).analytics, true)
  assert.equal(read({ version: 2, maps: true, savedAt: 900 }), null)
  assert.equal(read({ version: 2, maps: true, analytics: 'true', savedAt: 900 }), null)
  assert.equal(read({ version: 2, maps: true, analytics: true, savedAt: 1001 }), null)
  assert.equal(read({ version: 2, maps: true, analytics: true, savedAt: 0 }, storage.consentMaxAge), null)
  assert.equal(storage.readStoredConsent({ getItem: () => '{bad json' }), null)
  assert.equal(storage.readStoredConsent({ getItem: () => { throw Error('storage disabled') } }), null)
})

test('Google tag is blocked before opt-in, loads once, counts committed EN/RU pages and stops on withdrawal', async () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const scripts = [], expired = []
  let cookies = '_ga=old; _ga_M322BVXRJG=old; unrelated=keep'
  globalThis.window = { location: { href: 'https://easyluxtransfer.com/contact?email=private@example.com#message', hostname: 'easyluxtransfer.com' } }
  globalThis.document = {
    title: 'Contact | Easy Lux Transfer', referrer: 'https://example.com/?email=secret#private',
    head: { appendChild: node => scripts.push(node) },
    createElement: () => ({ remove() { scripts.splice(scripts.indexOf(this), 1) } }),
    getElementById: id => scripts.find(script => script.id === id),
    get cookie() { return cookies }, set cookie(value) { expired.push(value) },
  }
  try {
    const analytics = await import(typescriptModule(new URL('../src/lib/analytics.ts', import.meta.url)))
    analytics.setAnalyticsConsent(false)
    analytics.trackAnalyticsPage()
    assert.equal(scripts.length, 0)
    assert.equal(window.dataLayer, undefined)
    analytics.setAnalyticsConsent(true)
    analytics.trackAnalyticsPage()
    analytics.setAnalyticsConsent(true) // StrictMode/storage sync must not load a second tag.
    analytics.trackAnalyticsPage()
    assert.equal(scripts.length, 1)
    assert.equal(scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-M322BVXRJG')
    assert.equal(scripts[0].async, true)
    let commands = window.dataLayer.map(args => Array.from(args))
    assert.deepEqual(commands[0], ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }])
    const config = commands.find(args => args[0] === 'config')
    assert.equal(config[1], 'G-M322BVXRJG')
    assert.equal(config[2].send_page_view, false)
    assert.equal(config[2].allow_google_signals, false)
    assert.equal(config[2].page_location, 'https://easyluxtransfer.com/contact')
    assert.equal(config[2].page_referrer, 'https://example.com/')
    assert.equal(commands.filter(args => args[0] === 'event').length, 1)
    window.location.href = 'https://easyluxtransfer.com/ru/services?name=private#water-taxi'
    document.title = 'Услуги и цены | Easy Lux Transfer'
    analytics.trackAnalyticsPage()
    window.location.href = 'https://easyluxtransfer.com/contact'
    document.title = 'Contact | Easy Lux Transfer'
    analytics.trackAnalyticsPage() // Back navigation is a new view.
    commands = window.dataLayer.map(args => Array.from(args))
    const events = commands.filter(args => args[0] === 'event')
    assert.equal(events.length, 3)
    assert.equal(events[1][2].page_title, 'Услуги и цены | Easy Lux Transfer')
    assert.equal(events[1][2].page_referrer, 'https://easyluxtransfer.com/contact')
    assert.doesNotMatch(JSON.stringify(commands), /private@example|email=|name=|#water-taxi/)
    analytics.setAnalyticsConsent(false)
    assert.equal(window['ga-disable-G-M322BVXRJG'], true)
    window.location.href = 'https://easyluxtransfer.com/'
    analytics.trackAnalyticsPage()
    assert.equal(window.dataLayer.filter(args => args[0] === 'event').length, 3)
    analytics.clearAnalyticsCookies()
    assert.ok(expired.some(value => value.startsWith('_ga=; Max-Age=0')))
    assert.ok(expired.some(value => value.startsWith('_ga_M322BVXRJG=; Max-Age=0')))
    assert.ok(expired.every(value => !value.includes('unrelated')))
    // If loading fails, opt-in can retry without keeping old queued page views.
    scripts[0].onerror()
    analytics.setAnalyticsConsent(true)
    analytics.trackAnalyticsPage()
    assert.equal(scripts.length, 1)
    assert.equal(window.dataLayer.filter(args => args[0] === 'event').length, 1)
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument
  }
})
