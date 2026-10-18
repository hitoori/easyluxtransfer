import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
})
after(() => server.close())

const { renderPage } = await server.ssrLoadModule('/src/prerender.tsx')
const { faqTopics } = await server.ssrLoadModule('/src/pages/faqData.ts')
const { popularTransferRoutes } = await server.ssrLoadModule('/src/data/transferRoutes.ts')
const { italyRoutes, mountainRoutes, coastalRoutes } = await server.ssrLoadModule('/src/components/services/serviceData.ts')
const { RouteList, RouteSection } = await server.ssrLoadModule('/src/components/services/ServiceRoutes.tsx')
const { withRenderLanguage, t } = await server.ssrLoadModule('/src/i18n/locale.tsx')
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[character])

for (const language of ['en', 'ru']) {
  test(`${language}: initial FAQ HTML includes every answer while only the selected category is shown`, async () => {
    const { content } = await renderPage('faq', language)
    const questions = faqTopics.flatMap(topic => topic.questions)
    withRenderLanguage(language, () => {
      for (const item of questions) {
        assert.ok(content.includes(escapeHtml(t(item.q))), `Missing question: ${item.id}`)
        assert.ok(content.includes(escapeHtml(t(item.a))), `Missing answer: ${item.id}`)
        assert.equal(content.split(`id="fq-question-${item.id}"`).length - 1, 1)
        assert.equal(content.split(`id="fq-answer-${item.id}"`).length - 1, 1)
      }
    })
    assert.equal((content.match(/<article\b[^>]*class="fq-question/g) ?? []).length, questions.length)
    assert.equal((content.match(/<article\b[^>]*hidden=""[^>]*class="fq-question/g) ?? []).length, questions.length - faqTopics[0].questions.length)
  })

  test(`${language}: initial Services HTML includes routes beyond every Show more control`, async () => {
    const { content, head } = await renderPage('services', language)
    for (const route of [...italyRoutes, ...mountainRoutes, ...coastalRoutes]) {
      assert.ok(content.includes(`data-route-id="${route.id}"`), `Missing route: ${route.id}`)
    }
    for (const id of ['italy-austria', 'italy-slovenia', 'italy-croatia', 'italy-france', 'marco-polo-bibione', 'marco-polo-lignano-sabbiadoro']) {
      assert.ok(content.includes(`data-route-id="${id}"`), `Missing route: ${id}`)
    }
    const mountains = content.match(/<table\b[^>]*id="mountain-route-table"[^>]*>([\s\S]*?)<\/table>/)?.[1]
    assert.ok(mountains)
    assert.equal((mountains.match(/<tr\b[^>]*data-route-id=/g) ?? []).length, mountainRoutes.length)
    assert.equal((mountains.match(/<tr\b[^>]*hidden=""/g) ?? []).length, mountainRoutes.length - 3)
    assert.ok(head.includes(`rel="canonical" href="https://easyluxtransfer.com${language === 'ru' ? '/ru' : ''}/services"`))
    if (language === 'ru') {
      assert.ok(content.includes('Из Венеции в Кортину'))
      assert.ok(content.includes('Трансферы из Венеции в Равенну, Триест и Фузину.'))
      assert.ok(!content.includes('Private chauffeur transfers (NCC)'))
    }
  })

  test(`${language}: all transfer explanations and useful links are available before tab interaction`, async () => {
    const { content } = await renderPage('services', language)
    const prefix = language === 'ru' ? '/ru' : ''
    for (const index of [0, 1, 2]) {
      assert.equal(content.split(`id="ac-journey-${index}"`).length - 1, 1)
      assert.ok(content.includes(`aria-controls="ac-journey-${index}"`))
      assert.match(content, new RegExp(`id="ac-journey-${index}"[^>]*aria-labelledby="ac-tab-${index}"`))
    }
    for (const index of [1, 2]) assert.match(content, new RegExp(`id="ac-journey-${index}"[^>]*hidden=""`))
    for (const question of ['meeting', 'return', 'venice-pickup']) {
      assert.ok(content.includes(`href="${prefix}/faq#fq-question-${question}"`))
    }
    assert.ok(content.includes(`href="${prefix}/faq"`), 'Services FAQ action must be a real crawlable link')
    if (language === 'ru') {
      assert.ok(content.includes('Местре'))
      assert.ok(!content.includes('Planning a return transfer'))
      assert.ok(!content.includes('Your driver can collect you at a train station'))
    } else {
      assert.ok(content.includes('Venice Marco Polo Airport (VCE)'))
      assert.ok(content.includes('Treviso Airport (TSF)'))
      assert.ok(content.includes('Your driver can collect you at a train station'))
    }
  })

  test(`${language}: Home exposes every route and links to specific transfer and practical information`, async () => {
    const { content } = await renderPage('home', language)
    const prefix = language === 'ru' ? '/ru' : ''
    for (const route of popularTransferRoutes) assert.ok(content.includes(`data-route-id="${route.id}"`))
    assert.equal((content.match(/data-route-id="[^"]+" hidden=""/g) ?? []).length, popularTransferRoutes.length - 5)
    for (const target of ['/services#ac-tab-2', '/services#service-europe', '/faq#fq-question-return', '/faq#fq-question-bags', '/faq#fq-question-child']) {
      assert.ok(content.includes(`href="${prefix}${target}"`), `Missing useful link: ${target}`)
    }
    const faq = await renderPage('faq', language)
    for (const target of ['ac-tab-2', 'service-airport', 'service-water-taxi', 'service-hourly', 'service-europe', 'service-custom']) {
      assert.ok(faq.content.includes(`href="${prefix}/services#${target}"`))
    }
  })
}

test('a closed route disclosure retains its full fare table in initial HTML', () => {
  const content = renderToStaticMarkup(createElement(RouteSection, { title: 'Italy routes', id: 'test-routes' },
    createElement(RouteList, { routes: italyRoutes, title: 'Italy fares', service: 'europe', initial: 3, onRequest: () => {} })))
  assert.match(content, /id="test-routes-panel" hidden=""/)
  for (const route of italyRoutes) assert.ok(content.includes(`data-route-id="${route.id}"`))
})

test('hero AVIF sources retain responsive WebP fallbacks in prerendered pages', async () => {
  for (const page of ['home', 'services']) {
    const { content } = await renderPage(page, 'en')
    assert.match(content, /<picture class="contents"><source type="image\/avif"[^>]*\.avif 640w[^>]*\.avif 960w/)
    assert.match(content, /fetchPriority="high"[^>]*srcSet="[^"]*\.webp 640w|srcSet="[^"]*\.webp 640w[^>]*fetchPriority="high"/i)
  }
})
