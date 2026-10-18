import { pagePath, type Page } from '../types/navigation'

const legacyPages = new Set<Page>(['home', 'services', 'about', 'faq', 'contact', 'cookies', 'terms'])

/** Only the old root-level page fragments are routes; section anchors stay intact. */
export function legacyPageDestination(location: Pick<Location, 'pathname' | 'search' | 'hash'>): string | null {
  if (!['/', '/ru', '/ru/'].includes(location.pathname)) return null
  let page: string
  try { page = decodeURIComponent(location.hash.slice(1)) } catch { return null }
  if (!legacyPages.has(page as Page)) return null
  const language = location.pathname.startsWith('/ru') ? 'ru' : 'en'
  return `${pagePath(page as Page, language)}${location.search}`
}
