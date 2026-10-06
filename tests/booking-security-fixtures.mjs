import { BookingRateLimiter } from '../worker/booking-security.js'

export function memoryStorage() {
  const entries = new Map()
  let alarm = null, pending = Promise.resolve()
  const storage = {
    get: async key => entries.get(key),
    put: async (key, value) => { entries.set(key, structuredClone(value)) },
    list: async () => new Map(entries),
    delete: async keys => { for (const key of Array.isArray(keys) ? keys : [keys]) entries.delete(key) },
    getAlarm: async () => alarm,
    setAlarm: async value => { alarm = value },
    transaction(callback) {
      const result = pending.then(() => callback(storage))
      pending = result.catch(() => {})
      return result
    },
  }
  return storage
}

export function testBookingEnv() {
  const limiter = new BookingRateLimiter({ storage: memoryStorage() })
  return {
    RESEND_API_KEY: 'test-key', BOOKING_FROM_EMAIL: 'Easy Lux <booking@example.com>', BOOKING_TO_EMAIL: 'office@example.com',
    TURNSTILE_SECRET_KEY: 'fake-test-secret', TURNSTILE_HOSTNAMES: 'easylux.example',
    BOOKING_LIMITER: { idFromName: name => name, get: () => ({ fetch: (url, options) => limiter.fetch(new Request(url, options)) }) },
  }
}

export function verifiedFetch(deliver) {
  return async (url, options) => {
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') return Response.json({ success: true, action: 'booking', hostname: 'easylux.example' })
    return deliver(url, options)
  }
}
