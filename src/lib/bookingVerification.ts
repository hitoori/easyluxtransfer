import { getLanguage } from '../i18n/translate'
import './booking-verification.css'
import { productionTurnstileHostnames, productionTurnstileSiteKey } from '../config/turnstile'

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  execute: (id: string) => void
  remove: (id: string) => void
}
declare global { interface Window { turnstile?: Turnstile } }
let scriptPromise: Promise<Turnstile> | undefined
let verifying = false

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) scriptPromise = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = window.setTimeout(failed, 15000)
    function failed() { window.clearTimeout(timeout); script.remove(); scriptPromise = undefined; reject(new Error('Security verification is unavailable. Please try again or contact us directly.')) }
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => { window.clearTimeout(timeout); if (window.turnstile) resolve(window.turnstile); else failed() }
    script.onerror = failed
    document.head.append(script)
  })
  return scriptPromise
}

/** Fresh single-use token on every attempt; booking IDs remain stable across retry. */
export async function getBookingVerification(): Promise<string> {
  const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ||
    (productionTurnstileHostnames.some(hostname => hostname === window.location.hostname) ? productionTurnstileSiteKey : '')
  if (!sitekey) throw new Error('Online booking is being configured. Please contact us directly for now.')
  if (verifying) throw new Error('Security verification is already in progress. Please wait.')
  verifying = true
  const ru = getLanguage() === 'ru'
  const dialog = document.createElement('dialog')
  dialog.className = 'booking-verification'
  dialog.setAttribute('aria-label', ru ? 'Проверка безопасности' : 'Security verification')
  const heading = document.createElement('h2')
  heading.textContent = ru ? 'Проверяем ваш запрос' : 'Verifying your request'
  const note = document.createElement('p')
  note.textContent = ru ? 'Это помогает защитить форму от спама.' : 'This helps protect the form from spam.'
  const widget = document.createElement('div')
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.textContent = ru ? 'Отмена' : 'Cancel'
  dialog.append(heading, note, widget, cancel)
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation() })
  let widgetId: string | undefined
  let api: Turnstile | undefined
  let timer: number | undefined
  try {
    document.body.append(dialog)
    dialog.showModal()
    return await new Promise<string>((resolve, reject) => {
      let settled = false
      const finish = (token?: string) => {
        if (settled) return
        settled = true
        token ? resolve(token) : reject(new Error('Security verification failed. Please try again or contact us directly.'))
      }
      cancel.onclick = () => finish()
      dialog.oncancel = event => { event.preventDefault(); finish() }
      timer = window.setTimeout(() => finish(), 60000)
      loadTurnstile().then(loaded => {
        if (settled) return
        api = loaded
        widgetId = api.render(widget, { sitekey, action: 'booking', execution: 'execute', appearance: 'interaction-only', theme: 'dark', size: 'flexible', language: ru ? 'ru' : 'en', callback: (token: string) => finish(token), 'error-callback': () => { finish(); return true }, 'expired-callback': () => finish(), 'timeout-callback': () => finish() })
        api.execute(widgetId)
      }).catch(() => finish())
    })
  } finally {
    window.clearTimeout(timer)
    try { if (api && widgetId) api.remove(widgetId) } finally {
      dialog.close(); dialog.remove(); verifying = false
    }
  }
}
