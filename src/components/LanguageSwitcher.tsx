import { useRef, type MouseEvent } from 'react'
import { loadLanguage, t, useLocale, type Language } from '../i18n/locale'
import { pagePath, type Page } from '../types/navigation'

export default function LanguageSwitcher({ page, onChange }: { page: Page; onChange?: () => void }) {
  const { language } = useLocale()
  const changeSequence = useRef(0)
  const change = async (event: MouseEvent<HTMLAnchorElement>, next: Language) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    const sequence = ++changeSequence.current
    if (next !== language) {
      try { await loadLanguage(next) } catch { window.location.assign(pagePath(page, next)); return }
      if (sequence !== changeSequence.current) return
      window.history.pushState({ page, language: next }, '', `${pagePath(page, next)}${window.location.hash}`)
      window.dispatchEvent(new Event('easylux-language'))
    }
    onChange?.()
  }
  return <nav className="language-switcher" aria-label={t('Language')}>
    {(['en', 'ru'] as const).map(next => <a key={next} href={pagePath(page, next)} hrefLang={next} lang={next} aria-current={language === next ? 'true' : undefined} onClick={event => change(event, next)}>{next.toUpperCase()}</a>)}
  </nav>
}
