# Easy Lux Transfer

React + TypeScript site for Easy Lux Transfer.

## Stack

- React 19
- TypeScript
- Tailwind CSS 4
- Vite

## Iconography

Interface icons combine the free MIT-licensed Pikaicons React set with Phosphor icons for transport and brand-specific symbols that are not included in the free Pikaicons package. Pikaicons are styled through `currentColor` to match the Easy Lux palette.

## Structure

- `src/pages/` — the seven website pages
- `src/components/` — shared layout and booking components
- `src/config/` — shared navigation configuration
- `src/types/` — shared TypeScript types
- `src/index.css` — design tokens, typography, Tailwind theme, and global styles
- `public/images/brand/` — active Easy Lux identity files
- `public/images/home/` — Home images grouped by section
- `public/images/services/` — Services images grouped by section
- `public/images/about/` — About images
- `public/images/shared/` — images reused across pages
- `IMAGE_CREDITS.md` — known stock photo credits, kept outside the published assets

## Commands

```bash
npm run dev
npm test
npm run build
```

## Cloudflare Workers deployment

The site and booking API deploy together as a Cloudflare Worker. `wrangler.jsonc` serves `dist/client` and sends `/api/booking` to `worker/index.js`.

1. Connect the GitHub repository to **Workers & Pages** in Cloudflare. Set the project root to the repository root, the production branch to `main`, the build command to `npm run build`, and the deploy command to `npx wrangler deploy`. The Worker name must be `easyluxtransfer`, matching `wrangler.jsonc`.
2. Set `VITE_GOOGLE_MAPS_API_KEY` as a **build variable** if address suggestions are needed. It is public in the browser, so restrict the key to the production domain and required Google APIs.
3. In the Worker's **Variables and Secrets**, set `RESEND_API_KEY`, `BOOKING_FROM_EMAIL`, and `BOOKING_TO_EMAIL`. The Resend key must be a secret. Optional social URLs are `BOOKING_INSTAGRAM_URL`, `BOOKING_FACEBOOK_URL`, and `BOOKING_TIKTOK_URL`. Configure and verify the sending domain in Resend before accepting real requests.
4. Configure Turnstile as described below, then check the exact built version on the intended hostname before attaching the public domain. Preview hostnames need their own explicit allowlist and widget configuration. The existing GitHub Pages workflow is a separate static preview; it does not publish the booking API.

For a local Cloudflare Worker preview, run `npm run preview:cloudflare`. Wrangler can read the ignored `.env.local` already used by Vite, or a separate ignored `.dev.vars` file. For a manual deployment from this folder, run `npm run deploy:cloudflare` after authenticating Wrangler. A local edit changes only localhost; with Git integration, the live site updates after the changes are committed and pushed to `main`, then Cloudflare finishes its build. Manual deployments use the deploy command instead.

## Booking delivery

The Home booking, Home quote, Services quote, and Contact forms use `/api/booking` to send two messages: a source-labelled request to Easy Lux and a matching acknowledgement to the customer. Quote and contact requests receive their own acknowledgement copy; booking tabs share the booking confirmation. A successful request is **not** a confirmed booking. When email delivery is not configured, the form displays an error and keeps the entered details.

### Activate form security before accepting enquiries

- Create a Cloudflare Turnstile **managed** widget for the real production hostname(s). The production widget public key is versioned in `src/config/turnstile.ts` and used only on the two production hostnames. `VITE_TURNSTILE_SITE_KEY` can override it for another explicitly configured build. Set `TURNSTILE_SECRET_KEY` as a Worker secret. Never use the secret in a `VITE_` variable. Rebuild after changing the public key.
- Set `TURNSTILE_HOSTNAMES` to the exact comma-separated allowed hostnames, without schemes or paths. The server checks success, hostname and the `booking` action; tokens are fresh on every submission/retry. Do not use Cloudflare dummy testing keys in production.
- Deploy the `BOOKING_LIMITER` Durable Object binding and the SQLite migration in `wrangler.jsonc` with the Worker. Do not remove the migration on subsequent deployments. The limiter atomically shares budgets across instances: 10 verification attempts per IP / 10 minutes, 200 globally / 10 minutes, 3 mail requests per recipient / hour and 60 globally / hour. Retries retain provider idempotency keys but still count against the budgets.
- Missing keys, hostname configuration or the binding stop email delivery with a clear contact fallback. There is no public bypass. The Vite-only preview cannot provide the Durable Object; use the Cloudflare preview for the API. Browser submissions require same-origin JSON and an actual body no larger than 24,000 UTF-8 bytes.
- Test missing/invalid verification, 413 and 429 responses, then one controlled real submission with an address you own after production configuration. Confirm both messages and the reference. Monitor legitimate peak demand before adjusting limits; do not simply disable protection.
- `_headers` adds static security/caching headers and a comprehensive CSP in **report-only** mode, while the framing/base/object protections are enforced. Review CSP reports with real Google Places and Turnstile before enforcement. API headers are set in the Worker. Configure canonical HTTPS/www redirects and preview `noindex` on the actual Cloudflare hostnames; the placeholder preview pattern must match your account subdomain.

### Activate Google address suggestions

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/) and attach a billing account.
2. Enable **Maps JavaScript API** and **Places API (New)** for that project.
3. Create a browser API key. Restrict it to your website's HTTP referrers (production domain and localhost for development) and to those APIs.
4. Put `VITE_GOOGLE_MAPS_API_KEY=...` in `.env.local` for local development, and set the same public build variable in production. Rebuild the site. The key is visible in the browser by design; its restrictions control usage. Without it, addresses remain editable manually.

### Activate email delivery

1. Create a [Resend](https://resend.com/) account using `easyluxtransfer@gmail.com` and create an API key.
2. For a no-domain test, set the sender to Resend's test sender and keep the company recipient as that account email. When submitting the form, enter the same address as the customer email so both test messages arrive in that inbox:

   ```text
   RESEND_API_KEY=re_...
   BOOKING_FROM_EMAIL=Easy Lux <onboarding@resend.dev>
   BOOKING_TO_EMAIL=easyluxtransfer@gmail.com
   BOOKING_INSTAGRAM_URL=
   BOOKING_FACEBOOK_URL=
   BOOKING_TIKTOK_URL=
   ```

   Resend only allows its shared test sender to deliver to the account owner. This confirms the app-to-email flow; it does not test delivery to external customers.

3. For customer delivery, add a domain you own in Resend and verify it by adding the DNS records shown in Resend at your domain provider. A Gmail inbox can still receive orders, but a verified sending domain is needed to send confirmations to customers.
4. Easy Lux uses the sending subdomain `mail.easyluxtransfer.com` in Resend's Ireland region. Keep receiving disabled there: requests and replies go to the existing Gmail inbox. Add exactly the DNS records provided by Resend, with CNAME records set to DNS only, then wait until the domain status is **Verified**. Set these **server-only** values in `.env.local` for local development and as secrets/environment variables in the production Worker:

   ```text
   RESEND_API_KEY=re_...
   BOOKING_FROM_EMAIL=Easy Lux <booking@mail.easyluxtransfer.com>
   BOOKING_TO_EMAIL=easyluxtransfer@gmail.com
   ```

   Add the company's Instagram, Facebook, and TikTok profile URLs as `BOOKING_INSTAGRAM_URL`, `BOOKING_FACEBOOK_URL`, and `BOOKING_TIKTOK_URL` to show those active links in the email footer. Leave a value empty to hide that channel.

5. Restart the local dev server or redeploy production after setting the values. Never prefix the Resend key with `VITE_` and never commit it to Git.
6. After domain verification, submit a test request using an email you own. Confirm that the client receives the acknowledgement and the company Gmail inbox receives the order. Check spam and Resend delivery logs if either is missing.

The Home forms use a required customer email to send the acknowledgement. All email delivery runs on the server, and failures are shown without a false success message.

`wrangler.jsonc` contains the public sender/recipient settings for future builds. `RESEND_API_KEY` stays in the Worker's encrypted secrets and the ignored local environment; it must never enter a frontend build variable. `npm test` checks delivery for all three Home booking categories plus Home quote, Services quote and Contact with a mocked email provider, without sending real mail.

Configuration verified on 2026-10-02: Resend reports `mail.easyluxtransfer.com` as **Verified**, and the live Worker has all three email settings. The owner confirmed that real submission emails arrive successfully. The existing booking, quote and Contact acknowledgement texts are preserved. Google project `Easy Lux Maps` (`easy-lux-maps`) is created in the owner’s personal account. Maps JavaScript API and Places API (New) are enabled, and the browser key is restricted to `https://easyluxtransfer.com/*` and those two APIs. The console shows linked billing with Pay as you go and zero usage; no monthly subscription was selected. The key is installed in ignored `.env.local` and the Cloudflare production build variable `VITE_GOOGLE_MAPS_API_KEY`; it also permits `http://localhost:5173/*` for local testing. Production was rebuilt from the already-published commit `512d611`, without publishing unrelated local edits. Google address suggestions and selecting Marco Polo Airport were verified on the live Home form. Email secrets and the existing acknowledgement templates were confirmed intact after the rebuild.


## Frontend assets, SEO and privacy preferences

Photographs are published as responsive WebP files. Editable originals are kept in `assets/source-images` outside the public directory. `src/config/image-manifest.json` connects original names to their optimized counterparts. `OptimizedImage` adds dimensions, lazy loading and responsive sources; important first-screen photos load eagerly. To regenerate images after replacing originals, run `python3 scripts/optimize-images.py` with Pillow available.

Fonts are self-hosted in `public/fonts` with their OFL licenses. `npm run build` also pre-renders all seven pages into HTML with page-specific titles, descriptions, canonical URLs and social previews. Other pages load as separate JavaScript/CSS chunks. Production route styles are included in the generated HTML to avoid an unstyled first render.

Home photographs and client stories advance every eight seconds with no visible pause buttons. Autoplay stops outside the viewport, in hidden tabs, for keyboard focus and when reduced motion is requested; hovering does not stop it. Manual navigation remains available, and Private Journey details stay on the selected destination while photographs rotate.

`useScrollReveal` shares one-time section entrances across the pages: 520ms opacity/translation transitions, with short staggered column entrances. Already-visible content and keyboard-focused controls remain immediately available. Without JavaScript, IntersectionObserver, or with reduced motion enabled, page content remains visible. Existing column transforms, responsive opacity and sticky navigation are preserved. The heading entrances follow the Services masthead rhythm; page navigation retains the current view until the destination commits, then resolves any requested section scroll.

Google Places suggestions and Google Analytics (`G-M322BVXRJG`) have independent, optional privacy preferences. Neither service loads before its own permission; rejecting Maps preserves manual entry. Accept all allows both; Reject non-essential and the initial banner's close action reject both. Manage preferences opens separate toggles, disabled initially; closing without saving leaves the stored choice unchanged. Category explanations expand independently of the toggles. Necessary preference storage and submission-time anti-spam protection remain active. The banner/dialog use the website's dark/ivory/gold theme, with full-width actions on phones. Refusing optional services does not block a booking request. Consent lasts 180 days. Maps-only choices from version 1 are preserved but never grant Analytics consent; the banner asks for a new choice. Withdrawing a loaded service refreshes the page and clears first-party `_ga` cookies. The combined Privacy Policy is at `/cookies`, in English and Russian, with concise cookie copy and expandable service details. Cookie/storage names, purposes and actual expiry are inside the relevant details; measurement IDs and token implementation notes are omitted from visible policy text. Legal disclosures and Cloudflare Turnstile processing remain covered.

Home and Services booking starters explain when address suggestions are disabled and offer an explicit enable action without granting Analytics consent or clearing the typed address. Rapidly returning to an address input after Cookie settings must cancel its previous blur-dismiss timer. Suggestions are biased toward Venice but international destinations remain available. Google attribution stays visible below the independently scrolling choices; provider failures retain manual entry and show an inline status.

### Google Analytics release settings

The async Google tag loads once, after Analytics consent, with Basic Consent Mode: Analytics storage is granted only after opt-in and all advertising consent types stay denied. Page views are sent after React commits the localized page title, including back/forward navigation and language changes. Query strings and fragments are excluded; enquiry contents are never added as Analytics event parameters. Google signals and advertising personalization are disabled. The cookie expiry is 180 days, renewed during use.

Before publishing, in GA4 **Admin → Data streams → Web stream → Enhanced measurement → Page views → advanced settings**, disable **Page changes based on browser history events**. React sends these page views itself; leaving Google's automatic history measurement enabled would duplicate them. Also review automatic form interactions, data sharing and retention for this property. See [Google's page-view guide](https://developers.google.com/analytics/devguides/collection/ga4/views) and [Basic Consent Mode](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic). Verify real delivery with Realtime/DebugView and Tag Assistant after publication and accepting Analytics. Local automated checks use a fake tag and do not confirm Google account ingestion.

The Privacy Policy and Booking Terms & Conditions are available in English and Russian. The separate `/terms` page reflects the owner-confirmed deposit, payment after the journey and 24-hour cancellation/refund arrangements; Home/Services booking reviews and the footer link to it without interpreting an enquiry or cookie choice as acceptance of a paid booking. The Contact enquiry form retains only its Privacy Policy link. Preserve the applicable version with each actual booking confirmation. The owner explicitly authorized publication on 2026-10-07. Actual operational retention and supplier/transfer agreements still require verification; publication does not certify legal compliance. Contractual wording, including the nature and proportionate amount of the deposit and operator-cancellation remedies, should be reviewed for the actual service before release. Performance and consent behavior should also be checked on the deployed domain, where hosting settings or later integrations may differ from localhost.


Production release preparation (2026-10-06): the real managed Turnstile widget “Easy Lux Transfer booking” is configured for `easyluxtransfer.com` and `www.easyluxtransfer.com`. Its private key is installed only in the Worker secret and ignored local environment. The versioned public key makes GitHub-triggered builds reproducible without relying on a missing build variable. Existing Resend settings remain unchanged. Public release is explicitly authorized by the owner; do not send real test emails.

GA4 stream `G-M322BVXRJG` preparation (2026-10-06): disabled “Page changes based on browser history events” and automatic Form interactions in the existing Easy Lux Website stream. The app handles committed-page measurement; keep those two automatic options off. Normal Analytics requires visitor consent.

Production preview URLs are explicitly disabled (`workers_dev: false`, `preview_urls: false`) to keep the Worker available only through its existing production custom domain. The report-only CSP allows the existing Cloudflare Web Analytics beacon added by the hosting platform.
