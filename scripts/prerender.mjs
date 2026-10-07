import { createServer } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { pages, renderPage, renderSitemap } = await server.ssrLoadModule('/src/prerender.tsx')
  const manifest = JSON.parse(await readFile('dist/client/.vite/manifest.json', 'utf8'))
  const base = process.env.GITHUB_ACTIONS === 'true' ? '/Easylux/' : '/'
  // Normalize an already rendered Home file too, so the script is repeatable.
  const template = (await readFile('dist/client/index.html', 'utf8'))
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<meta\b(?=[^>]*(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)")[^>]*>/g, '')
    .replace(/<link\b(?=[^>]*rel="(?:canonical|alternate)")[^>]*>/g, '')
    .replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/, '<div id="root"></div>\n</body>')
  const inlineHashes = new Set()
  for (const language of ['en', 'ru']) for (const page of [...pages, 'not-found']) {
    const { content, head } = await renderPage(page, language)
    const componentName = page === 'faq' ? 'FAQ' : page[0].toUpperCase() + page.slice(1)
    const route = manifest[`src/pages/${componentName}.tsx`]
    const routeHead = (route?.css ?? []).map(file => `<link rel="stylesheet" href="${base}${file}" />`).join('\n') + (route ? `\n<link rel="modulepreload" href="${base}${route.file}" />` : '')
    const languageTemplate = language === 'ru' ? template.replace('/fonts/font-6.woff2', '/fonts/font-2.woff2').replace('/fonts/font-12.woff2', '/fonts/font-8.woff2') : template
    const html = languageTemplate.replace(/<html\s+lang="[^"]*"/, `<html lang="${language}"`).replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\s+name="description"[\s\S]*?\/>/, '').replace('</head>', () => `${head}\n${routeHead}\n</head>`).replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
    for (const [, attributes, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (!/\bsrc=/.test(attributes)) inlineHashes.add(`'sha256-${createHash('sha256').update(content).digest('base64')}'`)
    }
    const directory = path.join('dist/client', language === 'ru' ? 'ru' : '', page === 'home' || page === 'not-found' ? '' : page)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, page === 'not-found' ? '404.html' : 'index.html'), html)
  }
  const headers = await readFile('public/_headers', 'utf8')
  await writeFile('dist/client/_headers', headers.replace('__INLINE_SCRIPT_HASHES__', [...inlineHashes].join(' ')))
  await writeFile('dist/client/sitemap.xml', renderSitemap())
  console.log(`Prerendered ${pages.length * 2} pages in English and Russian with canonical URLs and language alternates.`)
} finally { await server.close() }
