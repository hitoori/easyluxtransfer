import type { Page } from '../types/navigation'

export const pageLoaders = {
  services: () => import('../pages/Services'),
  about: () => import('../pages/About'),
  faq: () => import('../pages/FAQ'),
  contact: () => import('../pages/Contact'),
  cookies: () => import('../pages/Cookies'),
  terms: () => import('../pages/Terms'),
}
export function preloadPage(page: Page) {
  if (page === 'home') return
  void pageLoaders[page]().catch(() => { /* Navigation can retry a failed prefetch. */ })
}
