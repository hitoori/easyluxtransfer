import test from 'node:test'
import assert from 'node:assert/strict'
import { handleBookingRequest } from '../worker/index.js'
import { testBookingEnv, verifiedFetch } from './booking-security-fixtures.mjs'

const payload = {
  kind: 'transfer', source: 'home-booking', name: 'Test Client', email: 'client@example.com', phone: '+39 123456789',
  details: 'Pick-up: Venice\nDestination: Milan', consent: true,
  requestId: '124fe6c0-2f57-4faf-b4c6-72c431e63f25',
  turnstileToken: 'fake-verification-token',
}
const request = (body = payload) => new Request('https://easylux.example/api/booking', {
  method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://easylux.example' },
  body: JSON.stringify(body),
})

test('booking endpoint requires mail configuration', async () => {
  const response = await handleBookingRequest(request(), {})
  assert.equal(response.status, 503)
})

test('booking endpoint rejects invalid input before email delivery', async () => {
  const response = await handleBookingRequest(request({ ...payload, email: 'bad' }), {})
  assert.equal(response.status, 400)
})

test('WhatsApp contact preference requires a real international number', async () => {
  const response = await handleBookingRequest(request({ ...payload, preferredContact: 'whatsapp', phone: '+1------' }), {})
  assert.equal(response.status, 400)
})

test('booking endpoint sends company and customer emails with one idempotency key', async () => {
  const originalFetch = globalThis.fetch
  let sent
  globalThis.fetch = verifiedFetch(async (_url, options) => {
    sent = options
    return new Response(JSON.stringify({ data: [{ id: '1' }, { id: '2' }] }), { status: 200 })
  })
  try {
    const response = await handleBookingRequest(request(), testBookingEnv())
    assert.equal(response.status, 200)
    assert.equal((await response.json()).requestCode, 'ELX-124FE6C0')
    assert.equal(sent.headers['Idempotency-Key'], `booking/${payload.requestId}`)
    const messages = JSON.parse(sent.body)
    assert.deepEqual(messages.map(message => message.to[0]), ['office@example.com', payload.email])
    assert.match(messages[1].text, /deposit payment/)
    assert.match(messages[1].text, /not yet a confirmed booking/)
    assert.match(messages[0].text, /not yet a confirmed booking/)
  } finally { globalThis.fetch = originalFetch }
})

test('every public form sends its full details to the business and an acknowledgement to the customer', async () => {
  const originalFetch = globalThis.fetch
  const forms = [
    ['home-booking', 'transfer'], ['home-booking', 'hourly'], ['home-booking', 'tours'],
    ['home-quote', 'custom'], ['services-quote', 'custom'], ['contact', 'custom'],
  ]
  let messages
  globalThis.fetch = verifiedFetch(async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails/batch')
    messages = JSON.parse(options.body)
    return new Response(JSON.stringify({ data: [{ id: '1' }, { id: '2' }] }), { status: 200 })
  })
  try {
    for (const [source, kind] of forms) {
      const details = `Form: ${source}\nJourney: ${kind}\nAdditional request: child seat`
      const response = await handleBookingRequest(request({ ...payload, source, kind, details, ...(source === 'contact' ? { message: 'Additional request: child seat' } : {}) }), {
        ...testBookingEnv(),
        RESEND_API_KEY: 'test-key',
        BOOKING_FROM_EMAIL: 'Easy Lux <booking@mail.easyluxtransfer.com>',
        BOOKING_TO_EMAIL: 'easyluxtransfer@gmail.com',
      })
      assert.equal(response.status, 200, `${source}/${kind}`)
      assert.equal(messages.length, 2)
      assert.deepEqual(messages[0].to, ['easyluxtransfer@gmail.com'])
      assert.equal(messages[0].reply_to, payload.email)
      assert.equal(messages[0].from, 'Easy Lux Transfer <booking@mail.easyluxtransfer.com>')
      assert.ok(messages[0].text.includes(details))
      assert.deepEqual(messages[1].to, [payload.email])
      assert.equal(messages[1].reply_to, 'easyluxtransfer@gmail.com')
      assert.equal(messages[1].from, 'Easy Lux Transfer <booking@mail.easyluxtransfer.com>')
      assert.match(messages[1].html, /<img src="https:\/\/easyluxtransfer\.com\/images\/brand\/easy-lux-logo-wordmark\.png"/)
      assert.ok(messages[1].html.includes('YOUR DRIVER<br/>AROUND ITALY'))
      assert.ok(messages[1].text.includes(details))
      const templatePhrase = source === 'home-booking'
        ? 'all the details regarding your transfer have been registered in our system.'
        : source === 'contact'
          ? 'Your request is important to us'
          : 'is currently being processed by our team.'
      assert.ok(messages[1].text.includes(templatePhrase), `${source}: original text template`)
      assert.ok(messages[1].html.includes(templatePhrase), `${source}: original HTML template`)
      assert.ok(messages[1].text.includes(`Dear ${payload.name},`))
      assert.ok(!messages[1].text.includes('Your request has been sent.'))
    }
  } finally { globalThis.fetch = originalFetch }
})
