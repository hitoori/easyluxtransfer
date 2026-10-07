import { t, useLocale } from '../i18n/locale'
import { preloadPage } from '../config/pageLoaders'
import OptimizedImage from './OptimizedImage'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { navigationItems } from '../config/navigation'
import { pagePath, type Page } from '../types/navigation'
import { publicAsset } from '../lib/publicAsset'
import LanguageSwitcher from './LanguageSwitcher'

const logoImage = publicAsset('images/brand/easy-lux-site-logo-refined.png')

interface HeaderProps {
  currentPage: Page | undefined
  navigate: (page: Page) => void
}

export default function Header({ currentPage, navigate }: HeaderProps) {
  useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const elevatedRef = useRef(false)
  useEffect(() => {
    let frame = 0
    const readScroll = () => {
      frame = 0
      const next = window.scrollY > 64
      if (next !== elevatedRef.current) { elevatedRef.current = next; setScrolled(next) }
    }
    const updateHeaderState = () => { if (!frame) frame = window.requestAnimationFrame(readScroll) }

    updateHeaderState()
    window.addEventListener('scroll', updateHeaderState, { passive: true })

    return () => { window.removeEventListener('scroll', updateHeaderState); window.cancelAnimationFrame(frame) }
  }, [])

  const headerElevated = scrolled || menuOpen

  const navigateAndClose = (page: Page) => {
    setMenuOpen(false)
    navigate(page)
  }

  const followPageLink = (event: MouseEvent<HTMLAnchorElement>, page: Page) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigateAndClose(page)
  }

  return (
    <header
      onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus() } }}
      className={`fixed inset-x-0 top-0 z-50 ${
        headerElevated ? 'drop-shadow-[0_10px_28px_rgba(0,0,0,0.2)]' : ''
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[108px] transition-opacity duration-500 lg:h-[120px] ${
          headerElevated ? 'opacity-0' : 'opacity-100'
        } bg-[linear-gradient(180deg,rgba(7,10,11,0.91)_0%,rgba(7,10,11,0.86)_34%,rgba(7,10,11,0.73)_50%,rgba(7,10,11,0.52)_62%,rgba(7,10,11,0.3)_71%,rgba(7,10,11,0.13)_78%,rgba(7,10,11,0.04)_83%,rgba(7,10,11,0)_87%,rgba(7,10,11,0)_100%)]`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[96px] transition-opacity duration-500 lg:h-[104px] ${
          headerElevated ? 'opacity-100' : 'opacity-0'
        } bg-[linear-gradient(180deg,rgba(13,14,15,0.96)_0%,rgba(13,14,15,0.92)_58%,rgba(13,14,15,0.72)_76%,rgba(13,14,15,0.3)_90%,rgba(13,14,15,0)_100%)] backdrop-blur-[9px]`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-[71px] h-px bg-[rgba(194,154,69,0.16)] transition-opacity duration-500 lg:top-[75px] ${
          headerElevated ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 mx-auto flex w-full max-w-[1340px] items-center justify-between gap-5 px-4 transition-[height] duration-500 sm:px-7 lg:w-[92%] lg:px-0 ${
          headerElevated ? 'h-[72px] lg:h-[76px]' : 'h-[78px] lg:h-[86px]'
        }`}
      >
        {/* Logo */}
        <a
          href={pagePath('home')}
          onClick={event => followPageLink(event, 'home')}
          className="group flex h-full shrink-0 items-center text-left"
          aria-label={t("Easy Lux Transfer — Home")}
        >
          <OptimizedImage
            src={logoImage}
            alt="Easy Lux Transfer"
            loading="eager" sizes="72px"
            style={{ transform: 'scale(1.42) translate(-1px, -1px)' }}
            className={`translate-y-0.5 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.72)] transition-[width,height,transform] duration-500 group-hover:scale-[1.03] ${
              headerElevated
                ? 'h-[60px] w-[60px] sm:h-[60px] sm:w-[60px] lg:h-[62px] lg:w-[62px]'
                : 'h-[66px] w-[66px] sm:h-[66px] sm:w-[66px] lg:h-[72px] lg:w-[72px]'
            }`}
          />
          <span className="ml-2 border-l border-[var(--border-gold)] pl-2.5 text-[7px] font-medium uppercase leading-[1.65] tracking-[0.16em] text-[rgba(236,230,219,0.82)] sm:ml-3 sm:pl-3 sm:text-[8px] sm:tracking-[0.19em] lg:ml-3.5 lg:pl-3.5">
            <span className="block whitespace-nowrap">{t("Your driver")}</span>
            <span className="block whitespace-nowrap">{t("Around Italy")}</span>
          </span>
        </a>

        {/* Right-aligned desktop navigation */}
        <div className="ml-auto hidden items-center justify-end gap-7 xl:flex 2xl:gap-10">
          <nav className="flex items-center gap-7 2xl:gap-10" aria-label={t("Main navigation")}>
            {navigationItems.map((link) => (
              <a
                key={link.page}
                href={pagePath(link.page)}
                onPointerEnter={() => preloadPage(link.page)}
                onFocus={() => preloadPage(link.page)}
                onClick={event => followPageLink(event, link.page)}
                aria-current={currentPage === link.page ? 'page' : undefined}
                className={`relative whitespace-nowrap py-3.5 text-[16px] tracking-[0.025em] [text-shadow:0_2px_7px_rgba(0,0,0,0.92)] transition-colors duration-200 2xl:text-[18px] ${
                  currentPage === link.page
                    ? 'text-cream after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gold'
                    : 'text-[rgba(236,230,219,0.68)] hover:text-cream'
                }`}
              >
                {t(link.label)}
              </a>
            ))}
          </nav>
          <LanguageSwitcher page={currentPage ?? 'home'} />
          <a
            href={pagePath('contact')}
            onClick={event => followPageLink(event, 'contact')}
            className="flex shrink-0 items-center gap-2 rounded-sm border border-[rgba(194,154,69,0.72)] bg-[rgba(13,14,15,0.16)] px-7 py-4 text-[16px] font-medium tracking-[0.02em] text-gold-light shadow-[0_4px_18px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-gold hover:text-[var(--background)] 2xl:px-8 2xl:py-[18px] 2xl:text-[17px]"
          >
            {t(currentPage === 'home' || currentPage === 'services' ? 'Request a Quote' : 'Book Your Ride')}
          </a>
        </div>

        {/* Tablet/mobile actions */}
        <div className="ml-auto flex items-center justify-end xl:hidden">
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(value => !value)}
            className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-sm p-2.5"
            aria-label={t("Toggle menu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <span
              className={`block h-px w-full bg-cream transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
            />
            <span
              className={`block h-px w-full bg-cream transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block h-px w-full bg-cream transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-navigation"
        inert={!menuOpen}
        className={`relative z-10 overflow-hidden transition-all duration-300 xl:hidden ${
          menuOpen ? 'max-h-[calc(100dvh-72px)] overflow-y-auto' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col gap-3 border-t border-[rgba(194,154,69,0.1)] bg-[var(--background-secondary)] px-6 py-6">
          {navigationItems.map((link) => (
            <a
              key={link.page}
              href={pagePath(link.page)}
              onPointerEnter={() => preloadPage(link.page)}
                onFocus={() => preloadPage(link.page)}
                onClick={event => followPageLink(event, link.page)}
              aria-current={currentPage === link.page ? 'page' : undefined}
              className={`border-b border-[rgba(194,154,69,0.08)] py-5 text-left text-[20px] transition-colors last:border-0 ${
                currentPage === link.page
                  ? 'text-gold'
                  : 'text-[rgba(200,192,181,0.7)] hover:text-cream'
              }`}
            >
              {t(link.label)}
            </a>
          ))}
          <div className="pt-2">
            <LanguageSwitcher page={currentPage ?? 'home'} onChange={() => setMenuOpen(false)} />
          </div>
          <a
            href={pagePath('contact')}
            onClick={event => followPageLink(event, 'contact')}
            className="mt-3 flex min-h-[56px] w-full items-center justify-center rounded-sm border border-gold px-6 py-4 text-center text-[16px] font-medium leading-relaxed tracking-[0.02em] text-gold transition-all duration-300 hover:bg-gold hover:text-[var(--background)]"
          >
            {t(currentPage === 'home' || currentPage === 'services' ? 'Request a Quote' : 'Book Your Ride')}
          </a>
        </nav>
      </div>
    </header>
  )
}
