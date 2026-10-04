import { t, useLocale } from './i18n/locale'
import PageBoundary from './components/PageBoundary'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { pagePath, type Page } from './types/navigation'
import { updateNotFoundMetadata, updatePageMetadata } from './config/pageMetadata'
import { pageLoaders } from './config/pageLoaders'

const Services = lazy(pageLoaders.services)
const About = lazy(pageLoaders.about)
const FAQ = lazy(pageLoaders.faq)
const Contact = lazy(pageLoaders.contact)
const Cookies = lazy(pageLoaders.cookies)
const pageIds = new Set<Page>(['home', 'services', 'about', 'faq', 'contact', 'cookies'])

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

export default function App({ initialPage, prerenderedContent }: { initialPage?: Page | 'not-found'; prerenderedContent?: ReactNode } = {}) {
  const { language, syncLanguage } = useLocale()
  const [currentPage, setCurrentPage] = useState<Page | 'not-found'>(initialPage ?? getPageFromLocation)
  const [isPending, startTransition] = useTransition()
  const scrollAfterNavigation = useRef<string | null>(null)

  // Scroll only after the destination commits, while the outgoing page stays in place.
  useLayoutEffect(() => {
    if (scrollAfterNavigation.current === null) return
    const sectionId = scrollAfterNavigation.current
    scrollAfterNavigation.current = null
    scrollToPage(sectionId)
  }, [currentPage])

  useEffect(() => { currentPage === 'not-found' ? updateNotFoundMetadata() : updatePageMetadata(currentPage) }, [currentPage, language])
  useEffect(() => {
    const syncPageFromLocation = () => {
      syncLanguage()
      scrollAfterNavigation.current = ''
      startTransition(() => setCurrentPage(getPageFromLocation()))
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
    if (page !== getPageFromLocation()) {
      window.history.pushState({ page }, '', pagePath(page))
    }
    if (page === currentPage && !isPending) {
      scrollToPage(sectionId, sectionId || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')
      return
    }
    scrollAfterNavigation.current = sectionId ?? ''
    startTransition(() => setCurrentPage(page))
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
      default: return <Home navigate={navigate} />
    }
  }

  return <div className="min-h-screen bg-[var(--background)] text-cream">
    <Header currentPage={currentPage === 'not-found' ? undefined : currentPage} navigate={navigate} />
    <main aria-busy={isPending} inert={isPending}>
      <Suspense fallback={<div className="page-loading-preview">
        <span className="sr-only" role="status">{t("Loading page")}</span>
        <div className="page-loading-shapes" aria-hidden="true"><span /><span /><div /><span /></div>
      </div>}>
        <PageBoundary key={currentPage}><div className="page-enter" key={currentPage}>{renderPage()}</div></PageBoundary>
      </Suspense>
    </main>
    <div className={`page-transition-veil${isPending ? ' is-pending' : ''}`} aria-hidden="true" />
    <Footer navigate={navigate} />
  </div>
}
