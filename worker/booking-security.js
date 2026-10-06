const unavailable = { status: 503, error: "Online booking is being configured. Please contact us directly for now." };
const verificationError = { status: 403, error: "Security verification failed. Please try again or contact us directly." };
const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, "0")).join("");

// Gmail aliases share a mailbox. Keep other providers' local-part semantics intact.
const recipientKey = email => {
  const [local, domain] = email.toLowerCase().split("@");
  return ["gmail.com", "googlemail.com"].includes(domain)
    ? `${local.split("+")[0].replace(/\./g, "")}@gmail.com` : email.toLowerCase();
};

async function reserve(namespace, phase, ip, email) {
  const stub = namespace.get(namespace.idFromName("booking-mail-budget-v1"));
  const response = await stub.fetch("https://booking-budget.internal/reserve", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ phase, ip: await digest(ip), email: await digest(recipientKey(email)) }),
    signal: AbortSignal.timeout(5000),
  });
  const result = await response.json();
  if (response.status === 429 && Number.isFinite(result.retryAfter)) return {
    status: 429, error: "Too many requests. Please wait a few minutes or contact us directly.", retryAfter: result.retryAfter,
  };
  if (!response.ok || result.allowed !== true) throw new Error("Booking budget unavailable");
  return null;
}

// Every adapter uses this boundary. Configuration failures never bypass it.
export async function authorizeBooking(request, env, data, email) {
  const hosts = typeof env.TURNSTILE_HOSTNAMES === "string" ? env.TURNSTILE_HOSTNAMES.split(",").map(host => host.trim().toLowerCase()).filter(Boolean) : [];
  if (!env.TURNSTILE_SECRET_KEY || !env.BOOKING_LIMITER || !hosts.length) return unavailable;
  const token = data.turnstileToken;
  if (typeof token !== "string" || !token.trim() || token.length > 2048) return verificationError;
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  try {
    const attemptLimit = await reserve(env.BOOKING_LIMITER, "attempt", ip, email);
    if (attemptLimit) return attemptLimit;
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ...unavailable, error: "Security verification is unavailable. Please try again or contact us directly." };
    const verified = await response.json();
    const hostname = typeof verified.hostname === "string" ? verified.hostname.toLowerCase() : "";
    if (verified.success !== true || verified.action !== "booking" || !hosts.includes(hostname) || hostname !== new URL(request.url).hostname.toLowerCase()) return verificationError;
    return await reserve(env.BOOKING_LIMITER, "send", ip, email);
  } catch {
    return { ...unavailable, error: "Security verification is unavailable. Please try again or contact us directly." };
  }
}

// One shared, persistent Durable Object admits requests atomically across Workers.
// Store only hashed addresses, counters and expiry times, never enquiry contents.
export class BookingRateLimiter {
  constructor(state) { this.storage = state.storage; }

  async fetch(request) {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const data = await request.json();
    if (!["attempt", "send"].includes(data.phase) || !/^[a-f0-9]{64}$/.test(data.ip) || !/^[a-f0-9]{64}$/.test(data.email)) return new Response(null, { status: 400 });
    const now = Date.now();
    const rules = data.phase === "attempt"
      ? [{ key: "attempt:global", limit: 200, window: 600000 }, { key: `attempt:ip:${data.ip}`, limit: 10, window: 600000 }]
      : [{ key: "send:global", limit: 60, window: 3600000 }, { key: `send:email:${data.email}`, limit: 3, window: 3600000 }];
    const result = await this.storage.transaction(async transaction => {
      const counters = [];
      for (const rule of rules) {
        const stored = await transaction.get(rule.key);
        const counter = stored && stored.expires > now ? stored : { count: 0, expires: now + rule.window };
        if (counter.count >= rule.limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((counter.expires - now) / 1000)) };
        counters.push([rule.key, { count: counter.count + 1, expires: counter.expires }]);
      }
      for (const [key, counter] of counters) await transaction.put(key, counter);
      if (await transaction.getAlarm() === null) await transaction.setAlarm(now + 600000);
      return { allowed: true };
    });
    return Response.json(result, { status: result.allowed ? 200 : 429 });
  }

  async alarm() {
    const now = Date.now();
    const entries = await this.storage.list();
    const expired = [...entries].filter(([, value]) => value.expires <= now).map(([key]) => key);
    if (expired.length) await this.storage.delete(expired);
    if (entries.size > expired.length) await this.storage.setAlarm(now + 600000);
  }
}
