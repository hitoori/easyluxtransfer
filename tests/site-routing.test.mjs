import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../worker/index.js'

test('missing HTML keeps the asset 404 instead of serving the homepage', async () => {
  for (const method of ['GET', 'HEAD']) for (const path of ['/missing', '/ru/missing']) {
    const request = new Request(`https://easyluxtransfer.com${path}`, { method, headers: { accept: 'text/html' } })
    const response = await worker.fetch(request, { ASSETS: { fetch: async assetRequest => {
      assert.equal(assetRequest.url, request.url)
      assert.equal(assetRequest.method, method)
      return new Response(method === 'HEAD' ? null : 'Not found', { status: 404 })
    } } })
    assert.equal(response.status, 404)
  }
})

test('existing pages and asset redirects pass through unchanged', async () => {
  for (const status of [200, 301, 307]) {
    const expected = new Response(null, { status })
    const response = await worker.fetch(new Request('https://easyluxtransfer.com/ru/services'), { ASSETS: { fetch: async () => expected } })
    assert.equal(response, expected)
  }
})
