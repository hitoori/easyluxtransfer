import { getLanguage, loadLanguage, t, useLocale } from './i18n/locale'
import PageBoundary from './components/PageBoundary'
import { lazy, Suspense, useEffect, useLayoutEffect, useState, useTransition, type ReactNode } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { pagePath, type Page } from './types/navigation'
import { updateNotFoundMetadata, updatePageMetadata } from './config/pageMetadata'
import { pageLoaders } from './config/pageLoaders'
import { useCookieConsent } from './components/CookieConsent'
import { trackAnalyticsPage } from './lib/analytics'

const Services = lazy(pageLoaders.services)
const About = lazy(pageLoaders.about)
const FAQ = lazy(pageLoaders.faq)
const Contact = lazy(pageLoaders.contact)
const Cookies = lazy(pageLoaders.cookies)
const Terms = lazy(pageLoaders.terms)
const pageIds = new Set<Page>(['home', 'services', 'about', 'faq', 'contact', 'cookies', 'terms'])

const getPageFromLocation = (): Page | 'not-found' => {
  if (typeof window === 'undefined') return 'home'
  const pathPage = window.location.pathname.replace(/^\/ru(?:\/|$)/, '/').replace(/^\/+|\/+$/g, '')
  if (pathPage !== 'home' && pageIds.has(pathPage as Page)) return pathPage as Page
  if (pathPage !== '') return 'not-found'
  const hashPage = window.location.hash.slice(1) as Page
  return pageIds.has(hashPage) ? hashPage : 'home'
}

const scrollToPage = (sectionId?: string, behavior: ScrollBehavior = 'instant') => {
  const section = sectionId ? document.getElementById(sectionId) : null
  const top = section ? Math.max(0, section.getBoundingClientRect().top + window.scrollY - 148) : 0
  window.scrollTo({ top, behavior })
}

const sectionFromLocation = () => {
  try { return decodeURIComponent(window.location.hash.slice(1)) } catch { return '' }
}

type ScrollTarget = { sectionId: string; behavior: ScrollBehavior } | null

// Inside Suspense so the section exists before scrolling, including on a direct URL visit.
function ScrollAfterCommit({ target }: { target: ScrollTarget }) {
  useLayoutEffect(() => {
    if (!target) return
    scrollToPage(target.sectionId, target.behavior)
    if (!target.sectionId || target.behavior !== 'instant') return

    // Font loading can change the height of sections above a newly opened deep link.
    let cancelled = false
    let frame = 0
    const cancel = () => { cancelled = true; window.cancelAnimationFrame(frame) }
    window.addEventListener('wheel', cancel, { passive: true, once: true })
    window.addEventListener('touchstart', cancel, { passive: true, once: true })
    window.addEventListener('keydown', cancel, { once: true })
    document.fonts.ready.then(() => {
      if (!cancelled) frame = window.requestAnimationFrame(() => {
        if (!cancelled) scrollToPage(target.sectionId, 'instant')
      })
    })
    return () => {
      cancel()
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', cancel)
    }
  }, [target])
  return null
}

export default function App({ initialPage, prerenderedContent }: { initialPage?: Page | 'not-found'; prerenderedContent?: ReactNode } = {}) {
  const { language, syncLanguage } = useLocale()
  const { analytics } = useCookieConsent()
  const [currentPage, setCurrentPage] = useState<Page | 'not-found'>(initialPage ?? getPageFromLocation)
  const [isPending, startTransition] = useTransition()
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget>(() => typeof window !== 'undefined' && window.location.hash
    ? { sectionId: sectionFromLocation(), behavior: 'instant' } : null)

  useEffect(() => { currentPage === 'not-found' ? updateNotFoundMetadata() : updatePageMetadata(currentPage) }, [currentPage, language])
  // Record committed pages after their localized title changes, not in-progress navigation.
  useEffect(() => { if (analytics && !isPending) trackAnalyticsPage() }, [analytics, currentPage, language, isPending])
  useEffect(() => {
    const syncPageFromLocation = async () => {
      try { await loadLanguage(getLanguage()) } catch { window.location.reload(); return }
      syncLanguage()
      startTransition(() => {
        setCurrentPage(getPageFromLocation())
        setScrollTarget({ sectionId: sectionFromLocation(), behavior: 'instant' })
      })
    }
    window.addEventListener('hashchange', syncPageFromLocation)
    window.addEventListener('popstate', syncPageFromLocation)
    window.addEventListener('easylux-language', syncPageFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncPageFromLocation)
      window.removeEventListener('popstate', syncPageFromLocation)
      window.removeEventListener('easylux-language', syncPageFromLocation)
    }
  }, [startTransition])

  const navigate = (page: Page, sectionId?: string) => {
    const url = `${pagePath(page)}${sectionId ? `#${encodeURIComponent(sectionId)}` : ''}`
    if (url !== `${window.location.pathname}${window.location.hash}`) {
      window.history.pushState({ page }, '', url)
    }
    const behavior = page === currentPage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'
    startTransition(() => {
      setScrollTarget({ sectionId: sectionId ?? '', behavior })
      setCurrentPage(page)
    })
  }

  const renderPage = () => {
    if (prerenderedContent) return prerenderedContent
    switch (currentPage) {
      case 'not-found': return <NotFound navigate={navigate} />
      case 'services': return <Services navigate={navigate} />
      case 'about': return <About navigate={navigate} />
      case 'faq': return <FAQ navigate={navigate} />
      case 'contact': return <Contact navigate={navigate} />
      case 'cookies': return <Cookies />
      case 'terms': return <Terms />
      default: return <Home navigate={navigate} />
    }
  }

  return <div className="min-h-screen bg-[var(--background)] text-cream">
    <a className="skip-to-content" href="#main-content">{t('Skip to content')}</a>
    <Header currentPage={currentPage === 'not-found' ? undefined : currentPage} navigate={navigate} />
    <main id="main-content" tabIndex={-1} aria-busy={isPending} inert={isPending}>
      <Suspense fallback={<div className="page-loading-preview">
        <span className="sr-only" role="status">{t("Loading page")}</span>
        <div className="page-loading-shapes" aria-hidden="true"><span /><span /><div /><span /></div>
      </div>}>
        <PageBoundary key={currentPage}><div className="page-enter" key={currentPage}>{renderPage()}</div></PageBoundary>
        <ScrollAfterCommit target={scrollTarget} />
      </Suspense>
    </main>
    <div className={`page-transition-veil${isPending ? ' is-pending' : ''}`} aria-hidden="true" />
    <Footer navigate={navigate} />
  </div>
}
