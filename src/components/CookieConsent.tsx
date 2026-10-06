import { t, useLocale } from '../i18n/locale'
import { consentStorageKey as storageKey, readStoredConsent, type StoredConsent } from '../lib/consentStorage'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { pagePath } from '../types/navigation'
import './cookie-consent.css'
import { analyticsLoaded, clearAnalyticsCookies, setAnalyticsConsent } from '../lib/analytics'

export const addressSuggestionsConfigured = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim())
const ConsentContext = createContext({ maps: false, analytics: false, chosen: false, openSettings: () => {}, save: (_maps: boolean, _analytics = false) => {} })
export const useCookieConsent = () => useContext(ConsentContext)

function CookieIcon() {
  return <svg className="cookie-symbol" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M28 17A12 12 0 1 1 15 4a7 7 0 0 0 7 8 5 5 0 0 0 6 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="11" cy="13" r="1.5" fill="currentColor" /><circle cx="10" cy="21" r="1.5" fill="currentColor" /><circle cx="18" cy="22" r="1.5" fill="currentColor" /><circle cx="18" cy="15" r="1.5" fill="currentColor" /></svg>
}

const notice = addressSuggestionsConfigured
  ? 'We use essential technologies to remember your privacy choices and protect forms. With your permission, Google Analytics measures website use and Google Places suggests addresses. Choose Accept all, Reject non-essential or Manage preferences.'
  : 'We use essential technologies to remember your privacy choices and protect forms. With your permission, Google Analytics measures website use. Choose Accept all, Reject non-essential or Manage preferences.'

function ConsentCategory({ id, title, description, checked, onChange }: { id: string; title: string; description: string; checked: boolean; onChange?: (checked: boolean) => void }) {
  return <div className="cookie-category">
    <details><summary id={`${id}-label`}><strong>{t(title)}</strong>{!onChange && <span className="cookie-always">{t("Always active")}</span>}</summary><p>{t(description)}</p></details>
    <label className="cookie-category-toggle"><input type="checkbox" role="switch" checked={checked} disabled={!onChange} aria-labelledby={`${id}-label`} onChange={event => onChange?.(event.target.checked)} /></label>
  </div>
}

function readConsent(): StoredConsent | null {
  try { return readStoredConsent(localStorage) } catch { return null }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  useLocale()
  const [maps, setMaps] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [chosen, setChosen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [ready, setReady] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [draftMaps, setDraftMaps] = useState(false)
  const [draftAnalytics, setDraftAnalytics] = useState(false)

  useEffect(() => {
    const sync = () => {
      const saved = readConsent()
      setMaps(addressSuggestionsConfigured && Boolean(saved?.maps))
      const allowAnalytics = Boolean(saved?.analytics)
      setAnalyticsConsent(allowAnalytics)
      setAnalytics(allowAnalytics)
      setChosen(saved?.version === 2)
      setReady(true)
      if (!allowAnalytics) clearAnalyticsCookies()
      if ((!saved?.maps && document.querySelector('script[src*="maps.googleapis.com"]')) || (!allowAnalytics && analyticsLoaded())) window.location.reload()
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const save = (allowMaps: boolean, allowAnalytics = false) => {
    const next = addressSuggestionsConfigured && allowMaps
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, maps: next, analytics: allowAnalytics, savedAt: Date.now() })) } catch { /* The choice still applies to this page if browser storage is disabled. */ }
    setAnalyticsConsent(allowAnalytics)
    if (!allowAnalytics) clearAnalyticsCookies()
    setMaps(next)
    setAnalytics(allowAnalytics)
    setChosen(true)
    setSettings(false)
    if ((maps && !next) || (!allowAnalytics && analyticsLoaded())) window.location.reload()
  }
  const openSettings = () => { setDraftMaps(maps); setDraftAnalytics(analytics); setSettings(true) }
  useEffect(() => {
    if (settings) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [settings])

  return <ConsentContext.Provider value={{ maps, analytics, chosen, openSettings, save }}>
    {children}
    {ready && !chosen && <aside className="cookie-banner" aria-labelledby="cookie-banner-title">
      <CookieIcon />
      <div className="cookie-banner-copy"><h2 id="cookie-banner-title">{t("We use cookies")}</h2><p>{t(notice)} {t("For details, see our ")}<a href={pagePath('cookies')}>{t("Privacy Policy")}</a>{"."}</p></div>
      <div className="cookie-actions">
        <button type="button" className="cookie-settings-link" onClick={openSettings}>{t("Manage preferences")}</button>
        <button type="button" onClick={() => save(false)}>{t("Reject non-essential")}</button>
        <button type="button" className="cookie-accept" onClick={() => save(true, true)}>{t("Accept all")}</button>
      </div>
      <button type="button" className="cookie-close" aria-label={t("Reject non-essential and close")} onClick={() => save(false)}>{"×"}</button>
    </aside>}
    <dialog ref={dialogRef} className="cookie-dialog" aria-labelledby="cookie-dialog-title" onCancel={() => setSettings(false)} onClose={() => setSettings(false)}>
      <button type="button" className="cookie-close" aria-label={t("Close privacy preferences")} onClick={() => setSettings(false)}>{"×"}</button>
      <div className="cookie-dialog-copy">
        <CookieIcon />
        <h2 id="cookie-dialog-title">{t("Cookie preferences")}</h2>
        <p>{t("Choose which optional services Easy Lux Transfer may use. Each choice is independent. You can still request a journey if you reject them.")}</p>
        <p>{t("Your choice is remembered for 180 days. We do not use advertising trackers.")}</p>
        <a href={pagePath('cookies')}>{t("Privacy Policy")}</a>
      </div>
      <div className="cookie-dialog-options">
        <ConsentCategory id="cookie-necessary" title="Necessary storage & security" description="Remembers your privacy choice and protects forms against spam using Cloudflare Turnstile when you submit. These services do not measure visits or personalise advertising." checked />
        <ConsentCategory id="cookie-analytics" title="Analytics cookies" description="Optional. Google Analytics measures page visits and website use. Google receives cookie identifiers, page, device and connection information. Your enquiry details are not sent to Analytics." checked={draftAnalytics} onChange={setDraftAnalytics} />
        {addressSuggestionsConfigured && <ConsentCategory id="cookie-maps" title="Google address suggestions" description="Optional. Google Places receives your typed address searches and connection information. Without this service, you can enter addresses manually and still request a journey." checked={draftMaps} onChange={setDraftMaps} />}
        <p className="cookie-detail">{t("Disabling a Google service that has already loaded refreshes the page to stop it. Any unsent form entries will be cleared.")}</p>
        <div className="cookie-actions"><button type="button" onClick={() => save(false)}>{t("Reject non-essential")}</button><button type="button" onClick={() => save(draftMaps, draftAnalytics)}>{t("Save preferences")}</button><button type="button" className="cookie-accept" onClick={() => save(true, true)}>{t("Accept all")}</button></div>
      </div>
    </dialog>
  </ConsentContext.Provider>
}

export function CookieSettingsButton() {
  useLocale()
  const { openSettings } = useCookieConsent()
  return <button type="button" onClick={openSettings}>{t("Cookie settings")}</button>
}
