import { useLocale } from '../i18n/locale'
import { pagePath, type Page } from '../types/navigation'
import type { MouseEvent } from 'react'

export default function NotFound({ navigate }: { navigate: (page: Page) => void }) {
  const { language } = useLocale()
  const ru = language === 'ru'
  const follow = (event: MouseEvent<HTMLAnchorElement>, page: Page) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(page)
  }
  return <section className="mx-auto flex min-h-[75vh] max-w-[1340px] flex-col justify-center px-6 pb-20 pt-40 sm:px-8 lg:px-10">
    <p className="mb-7 text-sm tracking-[0.22em] text-[var(--gold)]">404</p>
    <h1 className="max-w-4xl font-serif text-5xl leading-tight sm:text-7xl">{ru ? 'Страница не найдена' : 'Page not found'}</h1>
    <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream/70">{ru ? 'Возможно, ссылка изменилась или страница больше недоступна. Продолжите на главной странице или свяжитесь с нами, чтобы организовать поездку.' : 'The link may have changed or the page may no longer be available. Continue from our homepage or contact us to arrange your journey.'}</p>
    <div className="mt-10 flex flex-wrap gap-4">
      {([{ page: 'home', label: ru ? 'На главную' : 'Back to home' }, { page: 'contact', label: ru ? 'Связаться с нами' : 'Contact us' }] as const).map(({ page, label }) => <a key={page} href={pagePath(page)} onClick={event => follow(event, page)} className="rounded border border-[var(--gold)]/50 px-6 py-3 text-base transition-colors hover:bg-[var(--gold)]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">{label}</a>)}
    </div>
  </section>
}
