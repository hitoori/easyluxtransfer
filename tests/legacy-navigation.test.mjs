import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'

const { legacyPageDestination } = await import(typescriptModule(new URL('../src/lib/legacyNavigation.ts', import.meta.url)))
const destination = (pathname, hash, search = '') => legacyPageDestination({ pathname, hash, search })

test('legacy root fragments resolve to real EN/RU pages and preserve query parameters', () => {
  for (const page of ['home', 'services', 'about', 'faq', 'contact', 'cookies', 'terms']) {
    assert.equal(destination('/', `#${page}`, '?utm_source=old-link'), `${page === 'home' ? '/' : `/${page}`}?utm_source=old-link`)
    for (const root of ['/ru', '/ru/']) {
      assert.equal(destination(root, `#${page}`), page === 'home' ? '/ru' : `/ru/${page}`)
    }
  }
  assert.equal(destination('/', '#%61bout'), '/about')
})

test('section anchors, existing page URLs, unknown routes and malformed fragments stay untouched', () => {
  for (const fragment of ['', '#main-content', '#ways-to-travel', '#service-airport', '#fq-question-return', '#unknown', '#%E0%A4%A', '#https%3A%2F%2Fexample.com']) {
    assert.equal(destination('/', fragment), null)
    assert.equal(destination('/ru', fragment), null)
  }
  for (const pathname of ['/about', '/services', '/ru/services', '/not-a-page', '/russian']) {
    assert.equal(destination(pathname, '#about'), null)
  }
})
