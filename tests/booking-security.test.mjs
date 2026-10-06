import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { handleBookingRequest } from '../worker/index.js'
import { BookingRateLimiter } from '../worker/booking-security.js'
import { MAX_REQUEST_BYTES, readLimitedBody, RequestTooLarge } from '../worker/request-body.js'
import { memoryStorage, testBookingEnv, verifiedFetch } from './booking-security-fixtures.mjs'

const payload = { kind: 'transfer', source: 'home-booking', name: 'Test Client', email: 'client@example.com', details: 'Venice to Treviso, two passengers', consent: true, requestId: '124fe6c0-2f57-4faf-b4c6-72c431e63f25', turnstileToken: 'fake-token' }
const request = (body = payload, headers = {}) => new Request('https://easylux.example/api/booking', { method: 'POST', headers: { origin: 'https://easylux.example', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
async function withFetch(handler, callback) {
  const original = globalThis.fetch; globalThis.fetch = handler
  try { await callback() } finally { globalThis.fetch = original }
}

test('streamed size cap rejects unknown fields, whitespace and UTF-8 bytes without trusting Content-Length', async () => {
  let calls = 0
  await withFetch(async () => { calls++; throw Error('Unexpected outbound call') }, async () => {
    for (const body of [JSON.stringify({ ...payload, ignored: 'x'.repeat(25000) }), JSON.stringify(payload) + ' '.repeat(25000), JSON.stringify({ ...payload, ignored: 'я'.repeat(13000) })]) {
      for (const headers of [{}, { 'content-length': '0' }]) assert.equal((await handleBookingRequest(request(body, headers), testBookingEnv())).status, 413)
    }
  })
  assert.equal(calls, 0)
})

test('shared reader caps Web streams and preserves Node response ability on overflow', async () => {
  let cancelled = false
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES)); controller.enqueue(new Uint8Array(1)) }, cancel() { cancelled = true } })
  await assert.rejects(readLimitedBody(stream), RequestTooLarge)
  assert.equal(cancelled, true)
  const incoming = Readable.from([Buffer.alloc(MAX_REQUEST_BYTES), Buffer.alloc(1)])
  await assert.rejects(readLimitedBody(incoming), RequestTooLarge)
  assert.equal(incoming.destroyed, false)
  incoming.destroy()
  assert.equal((await readLimitedBody(Readable.from([Buffer.alloc(MAX_REQUEST_BYTES)]))).byteLength, MAX_REQUEST_BYTES)
})

test('Gmail dot/plus aliases share recipient quota; custom-domain addresses keep their own semantics', async () => {
  const env = testBookingEnv()
  const delivered = []
  await withFetch(verifiedFetch(async (_url, options) => { delivered.push(JSON.parse(options.body)[1].to[0]); return Response.json({data:[]}) }), async () => {
    for (const email of ['victim@gmail.com', 'v.ictim+one@gmail.com', 'victim+two@googlemail.com']) {
      assert.equal((await handleBookingRequest(request({...payload,email,requestId:crypto.randomUUID()}), env)).status,200)
    }
    assert.equal((await handleBookingRequest(request({...payload,email:'v.i.c.t.i.m+three@gmail.com',requestId:crypto.randomUUID()}),env)).status,429)
    for (const email of ['user@custom.example', 'u.ser@custom.example', 'user+one@custom.example']) {
      assert.equal((await handleBookingRequest(request({...payload,email,requestId:crypto.randomUUID()}),env)).status,200)
    }
    assert.equal((await handleBookingRequest(request({...payload,email:'<victim@gmail.com>'}),env)).status,400)
  })
  assert.deepEqual(delivered.slice(0,3), ['victim@gmail.com','v.ictim+one@gmail.com','victim+two@googlemail.com'])
  assert.equal(delivered.length,6)
})

test('absent Origin, invalid media types, arrays and oversized identity fields never reach providers', async () => {
  let calls = 0
  await withFetch(async () => { calls++; throw Error('Unexpected outbound call') }, async () => {
    assert.equal((await handleBookingRequest(request(payload, { origin: '' }), testBookingEnv())).status, 403)
    assert.equal((await handleBookingRequest(request(payload, { 'content-type': 'text/plain; application/json' }), testBookingEnv())).status, 415)
    for (const data of [[], { ...payload, name: 'x'.repeat(121) }, { ...payload, email: ['client@example.com'] }, { ...payload, source: 'contact', message: 'x' }]) assert.equal((await handleBookingRequest(request(data), testBookingEnv())).status, 400)
  })
  assert.equal(calls, 0)
})

test('missing security configuration fails closed, including requests claiming a bypass', async () => {
  let calls = 0
  await withFetch(async () => { calls++; throw Error('Unexpected outbound call') }, async () => {
    for (const key of ['TURNSTILE_SECRET_KEY', 'TURNSTILE_HOSTNAMES', 'BOOKING_LIMITER']) {
      const env = testBookingEnv(); delete env[key]
      assert.equal((await handleBookingRequest(request({ ...payload, test: true, bypass: true }), env)).status, 503)
    }
  })
  assert.equal(calls, 0)
})

test('missing or oversized verification token fails before outbound calls', async () => {
  let calls = 0
  await withFetch(async () => { calls++; throw Error('Unexpected outbound call') }, async () => {
    for (const token of [undefined, '', 123, 'x'.repeat(2049)]) assert.equal((await handleBookingRequest(request({ ...payload, turnstileToken: token }), testBookingEnv())).status, 403)
  })
  assert.equal(calls, 0)
})

test('invalid, replayed, wrong-host and wrong-action challenges never send email', async () => {
  for (const result of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, action: 'other', hostname: 'easylux.example' }, { success: true, action: 'booking', hostname: 'attacker.example' }, { success: 'true', action: 'booking', hostname: 'easylux.example' }]) {
    let mails = 0
    await withFetch(async url => { if (url.includes('siteverify')) return Response.json(result); mails++; return Response.json({}) }, async () => {
      assert.equal((await handleBookingRequest(request(), testBookingEnv())).status, 403)
    })
    assert.equal(mails, 0)
  }
})

test('verification provider outage and quota outage fail closed', async () => {
  await withFetch(async () => { throw Error('Offline') }, async () => assert.equal((await handleBookingRequest(request(), testBookingEnv())).status, 503))
  const env = testBookingEnv(); env.BOOKING_LIMITER.get = () => ({ fetch: async () => { throw Error('Storage offline') } })
  await withFetch(async () => { throw Error('No outbound call expected') }, async () => assert.equal((await handleBookingRequest(request(), env)).status, 503))
})

test('changing UUIDs and form sources cannot bypass recipient budgets', async () => {
  let mails = 0; const env = testBookingEnv()
  await withFetch(verifiedFetch(async () => { mails++; return Response.json({}) }), async () => {
    for (let i = 0; i < 3; i++) assert.equal((await handleBookingRequest(request({ ...payload, source: ['home-booking', 'home-quote', 'services-quote'][i], requestId: crypto.randomUUID() }), env)).status, 200)
    const blocked = await handleBookingRequest(request({ ...payload, email: 'CLIENT@EXAMPLE.COM', requestId: crypto.randomUUID() }), env)
    assert.equal(blocked.status, 429); assert.ok(Number(blocked.headers.get('retry-after')) > 0)
  })
  assert.equal(mails, 3)
})

test('IP budgets limit invalid challenges even with rotating emails and IDs', async () => {
  let verifications = 0; const env = testBookingEnv()
  await withFetch(async () => { verifications++; return Response.json({ success: false }) }, async () => {
    for (let i = 0; i < 10; i++) assert.equal((await handleBookingRequest(request({ ...payload, email: `client${i}@example.com`, requestId: crypto.randomUUID() }), env)).status, 403)
    assert.equal((await handleBookingRequest(request({ ...payload, requestId: crypto.randomUUID() }), env)).status, 429)
  })
  assert.equal(verifications, 10)
})

test('durable quota admission is atomic, survives instances and reclaims expired hashes', async () => {
  const storage = memoryStorage(); const limiter = new BookingRateLimiter({ storage })
  const send = (instance, phase, ip = 'a'.repeat(64), email = 'b'.repeat(64)) => instance.fetch(new Request('https://internal/reserve', { method: 'POST', body: JSON.stringify({ phase, ip, email }) }))
  const responses = await Promise.all(Array.from({ length: 12 }, () => send(limiter, 'send')))
  assert.equal(responses.filter(r => r.status === 200).length, 3)
  assert.equal((await send(new BookingRateLimiter({ storage }), 'send')).status, 429)
  const originalNow = Date.now; Date.now = () => originalNow() + 3600001
  try { await limiter.alarm(); assert.equal((await storage.list()).size, 0); assert.equal((await send(limiter, 'send')).status, 200) }
  finally { Date.now = originalNow }
})

test('global send and verification budgets cap distributed rotation', async () => {
  const limiter = new BookingRateLimiter({ storage: memoryStorage() })
  for (const [phase, limit] of [['send', 60], ['attempt', 200]]) {
    for (let i = 0; i < limit; i++) assert.equal((await limiter.fetch(new Request('https://internal/reserve', { method: 'POST', body: JSON.stringify({ phase, ip: i.toString(16).padStart(64, '0'), email: i.toString(16).padStart(64, '0') }) }))).status, 200)
    assert.equal((await limiter.fetch(new Request('https://internal/reserve', { method: 'POST', body: JSON.stringify({ phase, ip: 'f'.repeat(64), email: 'e'.repeat(64) }) }))).status, 429)
  }
})
