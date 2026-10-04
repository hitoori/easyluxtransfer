import { createServer } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { pages, renderPage } = await server.ssrLoadModule('/src/prerender.tsx')
  const manifest = JSON.parse(await readFile('dist/client/.vite/manifest.json', 'utf8'))
  const base = process.env.GITHUB_ACTIONS === 'true' ? '/Easylux/' : '/'
  // Normalize an already rendered Home file too, so the script is repeatable.
  const template = (await readFile('dist/client/index.html', 'utf8'))
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<meta\b(?=[^>]*(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)")[^>]*>/g, '')
    .replace(/<link\b(?=[^>]*rel="(?:canonical|alternate)")[^>]*>/g, '')
    .replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/, '<div id="root"></div>\n</body>')
  for (const language of ['en', 'ru']) for (const page of [...pages, 'not-found']) {
    const { content, head } = renderPage(page, language)
    const componentName = page === 'faq' ? 'FAQ' : page[0].toUpperCase() + page.slice(1)
    const route = manifest[`src/pages/${componentName}.tsx`]
    const routeHead = (route?.css ?? []).map(file => `<link rel="stylesheet" href="${base}${file}" />`).join('\n') + (route ? `\n<link rel="modulepreload" href="${base}${route.file}" />` : '')
    const html = template.replace(/<html\s+lang="[^"]*"/, `<html lang="${language}"`).replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\s+name="description"[\s\S]*?\/>/, '').replace('</head>', () => `${head}\n${routeHead}\n</head>`).replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
    const directory = path.join('dist/client', language === 'ru' ? 'ru' : '', page === 'home' || page === 'not-found' ? '' : page)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, page === 'not-found' ? '404.html' : 'index.html'), html)
  }
  console.log(`Prerendered ${pages.length * 2} pages in English and Russian with canonical URLs and language alternates.`)
} finally { await server.close() }
