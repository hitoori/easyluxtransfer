// Google tag gateway: https://developers.google.com/tag-platform/tag-manager/gateway/setup-guide?setup=manual
// Only this reserved path is proxied. Pages, assets and booking requests keep their existing handlers.
export const googleTagGatewayPath = '/5tpj/';
const productionHosts = new Set(['easyluxtransfer.com', 'www.easyluxtransfer.com']);
const googleTagId = 'G-M322BVXRJG';

export function isGoogleTagGatewayRequest(request) {
  return new URL(request.url).pathname.startsWith(googleTagGatewayPath);
}

export async function forwardGoogleTagRequest(request) {
  const url = new URL(request.url);
  if (!productionHosts.has(url.hostname)) return new Response('Not found', { status: 404 });
  if (!['GET', 'HEAD', 'POST', 'OPTIONS'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD, POST, OPTIONS' } });
  }

  // A fixed Google origin prevents this endpoint from becoming an arbitrary proxy.
  url.protocol = 'https:';
  // Use the header-based form from Google's Cloudflare example, without repeating the ID in the host.
  url.hostname = 'fps.goog';
  url.port = '';
  const forwarded = new Request(url, request);
  forwarded.headers.delete('authorization');
  forwarded.headers.delete('proxy-authorization');
  forwarded.headers.delete('host');
  forwarded.headers.set('X-Gtg-Tag-Id', googleTagId);

  // Forward Cloudflare's trusted visitor metadata, never client-supplied forwarding headers.
  for (const name of ['X-Forwarded-For', 'X-Forwarded-Country', 'X-Forwarded-Region', 'X-Forwarded-CountryRegion', 'X-Forwarded-Geolocation']) forwarded.headers.delete(name);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) forwarded.headers.set('X-Forwarded-For', ip);
  const geo = request.cf || {};
  if (geo.country) forwarded.headers.set('X-Forwarded-Country', geo.country);
  if (geo.regionCode) forwarded.headers.set('X-Forwarded-Region', geo.regionCode);
  if (geo.latitude != null && geo.longitude != null && geo.city) {
    forwarded.headers.set('X-Forwarded-Geolocation', `latlong=${geo.latitude},${geo.longitude};city=${geo.city}`);
  }

  try {
    let upstream = await fetch(forwarded, { redirect: 'manual' });
    // Google can redirect script delivery to its tag CDN. Follow it on the server so the
    // browser continues to load from our domain, without following arbitrary destinations.
    for (let hop = 0; ['GET', 'HEAD'].includes(request.method) && [301, 302, 303, 307, 308].includes(upstream.status); hop++) {
      const location = upstream.headers.get('Location');
      const destination = location && new URL(location, forwarded.url);
      if (hop >= 2 || !destination || destination.protocol !== 'https:' || destination.hostname !== 'www.googletagmanager.com' || destination.port) {
        throw new Error('Unexpected tag redirect');
      }
      upstream = await fetch(new Request(destination, { method: request.method, headers: forwarded.headers }), { redirect: 'manual' });
    }
    const response = new Response(upstream.body, upstream);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Measurement responses must not be shared between visitors by intermediary caches.
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return new Response('Measurement temporarily unavailable', { status: 502, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  }
}
