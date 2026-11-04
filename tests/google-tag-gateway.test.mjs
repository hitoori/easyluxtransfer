import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import worker from '../worker/index.js'

test('only the reserved gateway path is routed; production previews and lookalike paths stay isolated', async () => {
  let assetCalls = 0
  const env = { ASSETS: { fetch: async () => { assetCalls++; return new Response('asset', { status: 404 }) } } }
  for (const path of ['/', '/services', '/5tpj', '/5tpj-other/', '/ru/5tpj/healthy']) {
    assert.equal((await worker.fetch(new Request(`https://easyluxtransfer.com${path}`), env)).status, 404)
  }
  assert.equal(assetCalls, 5)
  for (const host of ['localhost', '127.0.0.1', 'easyluxtransfer.pages.dev', 'easyluxtransfer.com.example.org']) {
    assert.equal((await worker.fetch(new Request(`https://${host}/5tpj/healthy`), env)).status, 404)
  }
  assert.equal(assetCalls, 5)
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))
  assert.ok(config.assets.run_worker_first.includes('/5tpj/*'))
  assert.ok(config.assets.run_worker_first.includes('/api/*'))
})

test('gateway preserves script and collection requests and responses with a fixed destination and trusted geo', async () => {
  const originalFetch = globalThis.fetch
  const received = []
  globalThis.fetch = async (request, options) => {
    received.push({ request, options, body: await request.text() })
    return new Response(['HEAD', 'POST'].includes(request.method) ? null : 'google-response', {
      status: request.method === 'POST' ? 204 : 200,
      headers: { 'Content-Type': 'application/javascript', 'Set-Cookie': '_ga=test; Path=/', 'Cache-Control': 'public, max-age=3600' },
    })
  }
  try {
    for (const [host, method, path] of [
      ['easyluxtransfer.com', 'GET', '/5tpj/?id=G-M322BVXRJG&l=dataLayer'],
      ['www.easyluxtransfer.com', 'HEAD', '/5tpj/healthy'],
      ['easyluxtransfer.com', 'POST', '/5tpj/g/collect?v=2&tid=G-M322BVXRJG'],
    ]) {
      const request = new Request(`https://${host}${path}`, {
        method, headers: { 'CF-Connecting-IP': '203.0.113.12', 'X-Forwarded-For': 'spoofed', 'X-Forwarded-CountryRegion': 'FAKE', Cookie: '_ga=test', Authorization: 'Bearer private' },
        ...(method === 'POST' ? { body: 'en=generate_lead&gcs=G111' } : {}),
      })
      Object.defineProperty(request, 'cf', { value: { country: 'IT', regionCode: '34', latitude: '45.67', longitude: '12.24', city: 'Treviso' } })
      const response = await worker.fetch(request, { ASSETS: { fetch: () => assert.fail('Gateway must run before static assets') } })
      assert.equal(response.status, method === 'POST' ? 204 : 200)
      assert.equal(response.headers.get('content-type'), 'application/javascript')
      assert.equal(response.headers.get('set-cookie'), '_ga=test; Path=/')
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
      const forwarded = received.at(-1)
      assert.equal(forwarded.request.url, `https://fps.goog${path}`)
      assert.equal(forwarded.request.method, method)
      assert.equal(forwarded.options.redirect, 'manual')
      assert.equal(forwarded.request.headers.get('x-gtg-tag-id'), 'G-M322BVXRJG')
      assert.equal(forwarded.request.headers.get('authorization'), null)
      assert.equal(forwarded.request.headers.get('x-forwarded-for'), '203.0.113.12')
      assert.equal(forwarded.request.headers.get('x-forwarded-countryregion'), null)
      assert.equal(forwarded.request.headers.get('x-forwarded-country'), 'IT')
      assert.equal(forwarded.request.headers.get('x-forwarded-region'), '34')
      assert.equal(forwarded.request.headers.get('x-forwarded-geolocation'), 'latlong=45.67,12.24;city=Treviso')
      assert.equal(forwarded.request.headers.get('cookie'), '_ga=test')
      assert.equal(forwarded.body, method === 'POST' ? 'en=generate_lead&gcs=G111' : '')
    }
  } finally { globalThis.fetch = originalFetch }
})

test('Google CDN redirects are served through the gateway, while unrelated destinations and loops fail closed', async () => {
  const originalFetch = globalThis.fetch
  try {
    let calls = 0
    globalThis.fetch = async request => {
      calls++
      if (calls === 1) return new Response(null, { status: 302, headers: { Location: 'https://www.googletagmanager.com/gtag/js?id=G-M322BVXRJG&mpath=%2F5tpj%2F' } })
      assert.equal(new URL(request.url).hostname, 'www.googletagmanager.com')
      return new Response('google-script', { headers: { 'Content-Type': 'application/javascript' } })
    }
    const script = await worker.fetch(new Request('https://easyluxtransfer.com/5tpj/'), {})
    assert.equal(script.status, 200)
    assert.equal(await script.text(), 'google-script')
    assert.equal(calls, 2)
    calls = 0
    globalThis.fetch = async () => { calls++; return new Response(null, { status: 302, headers: { Location: 'https://example.com/' } }) }
    assert.equal((await worker.fetch(new Request('https://easyluxtransfer.com/5tpj/'), {})).status, 502)
    assert.equal(calls, 1)
    calls = 0
    globalThis.fetch = async () => { calls++; return new Response(null, { status: 302, headers: { Location: 'https://www.googletagmanager.com/loop' } }) }
    assert.equal((await worker.fetch(new Request('https://easyluxtransfer.com/5tpj/'), {})).status, 502)
    assert.equal(calls, 3)
  } finally { globalThis.fetch = originalFetch }
})

test('unsupported methods, missing geography and Google failures cannot break pages or bookings', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = () => assert.fail('Unsupported methods must never be forwarded')
    const unsupported = await worker.fetch(new Request('https://easyluxtransfer.com/5tpj/', { method: 'DELETE' }), {})
    assert.equal(unsupported.status, 405)
    globalThis.fetch = async request => {
      assert.equal(request.headers.get('x-forwarded-geolocation'), null)
      assert.equal(request.headers.get('x-forwarded-country'), null)
      throw Error('Google unavailable')
    }
    const failed = await worker.fetch(new Request('https://easyluxtransfer.com/5tpj/'), {})
    assert.equal(failed.status, 502)
    assert.equal(failed.headers.get('cache-control'), 'no-store')
    const page = await worker.fetch(new Request('https://easyluxtransfer.com/services'), { ASSETS: { fetch: async () => new Response('services') } })
    assert.equal(await page.text(), 'services')
  } finally { globalThis.fetch = originalFetch }
})
