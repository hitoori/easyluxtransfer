import { renderToString } from 'react-dom/server'
import App from './App'
import { CookieConsentProvider } from './components/CookieConsent'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import Cookies from './pages/Cookies'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'
import { alternateLinks, metadataTags, pageMetadata, siteOrigin } from './config/pageMetadata'
import { loadLanguage, LocaleProvider, t, withRenderLanguage, type Language } from './i18n/locale'
import { pagePath, type Page } from './types/navigation'

export const pages = Object.keys(pageMetadata) as Page[]
const noop = () => {}
const components = { home: Home, services: Services, about: About, faq: FAQ, contact: Contact, cookies: Cookies, terms: Terms }
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
export async function renderPage(page: Page | 'not-found', language: Language = 'en') {
  await loadLanguage(language)
  return withRenderLanguage(language, () => {
  const Component = page === 'not-found' ? NotFound : components[page]
  const content = renderToString(<LocaleProvider initialLanguage={language}><CookieConsentProvider><App initialPage={page} prerenderedContent={<Component navigate={noop} />} /></CookieConsentProvider></LocaleProvider>)
  if (page === 'not-found') return { content, head: `<title>${language === 'ru' ? 'Страница не найдена' : 'Page not found'} | Easy Lux Transfer</title>\n<meta name="robots" content="noindex, follow" />` }
  const head = `<title>${escape(t(pageMetadata[page].title))}</title>\n<link rel="canonical" href="${siteOrigin}${pagePath(page)}" />\n${alternateLinks(page)}\n` + Object.entries(metadataTags(page)).map(([name, value]) => `<meta ${name.startsWith('og:') ? 'property' : 'name'}="${name}" content="${escape(value)}" />`).join('\n')
  return { content, head }
  })
}
