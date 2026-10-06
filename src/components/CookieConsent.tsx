import { t, useLocale } from '../i18n/locale'
import { consentStorageKey as storageKey, readStoredConsent, type StoredConsent } from '../lib/consentStorage'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { pagePath } from '../types/navigation'
import './cookie-consent.css'
import { analyticsLoaded, clearAnalyticsCookies, setAnalyticsConsent } from '../lib/analytics'

export const addressSuggestionsConfigured = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim())
const ConsentContext = createContext({ maps: false, analytics: false, chosen: false, openSettings: () => {}, save: (_maps: boolean, _analytics = false) => {} })
export const useCookieConsent = () => useContext(ConsentContext)

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
      <div className="cookie-banner-copy"><span className="cookie-eyebrow">{t("Easy Lux · Your privacy")}</span><h2 id="cookie-banner-title">{t("Cookies & privacy")}</h2><p>{t("We use essential browser storage to remember your privacy preferences. ")}{t(addressSuggestionsConfigured ? 'With your permission, Google can also suggest addresses for your journey. ' : '')}{t("With your permission, Google Analytics helps us understand how visitors use this website. We do not use advertising trackers. ")}<a href={pagePath('cookies')}>{t("Privacy Policy")}</a>{"."}</p></div>
      <div className="cookie-actions">
        <button type="button" onClick={() => save(false)}>{t("Essential only")}</button>
        <button type="button" onClick={() => save(true, true)}>{t("Accept all")}</button>
        <button type="button" className="cookie-settings-link" onClick={openSettings}>{t("Manage preferences")}</button>
      </div>
    </aside>}
    <dialog ref={dialogRef} className="cookie-dialog" aria-labelledby="cookie-dialog-title" onCancel={() => setSettings(false)} onClose={() => setSettings(false)}>
      <button type="button" className="cookie-close" aria-label={t("Close privacy preferences")} onClick={() => setSettings(false)}>{"×"}</button>
      <span className="cookie-eyebrow">{t("Easy Lux · Your privacy")}</span>
      <h2 id="cookie-dialog-title">{t("Privacy preferences")}</h2>
      <p>{t("Essential storage remembers your choice for up to 180 days. It is always enabled. Optional services below are controlled separately.")}</p>
      {addressSuggestionsConfigured && <label className="cookie-option"><input type="checkbox" checked={draftMaps} onChange={event => setDraftMaps(event.target.checked)} /><span><strong>{t("Google address suggestions")}</strong><small>{t("Optional. When used, your typed address and connection data are sent to Google. You can enter an address manually with this disabled.")}</small></span></label>}
      <label className="cookie-option"><input type="checkbox" checked={draftAnalytics} onChange={event => setDraftAnalytics(event.target.checked)} /><span><strong>{t("Google Analytics")}</strong><small>{t("Optional. Measures page visits and website usage using cookies. Google receives technical connection and device information. Disabled until you allow it.")}</small></span></label>
      <p className="cookie-detail">{t("Disabling a Google service that has already loaded refreshes the page to stop it. Any unsent form entries will be cleared.")}</p>
      <div className="cookie-actions"><button type="button" onClick={() => save(false)}>{t("Essential only")}</button><button type="button" onClick={() => save(draftMaps, draftAnalytics)}>{t("Save preferences")}</button></div>
      <a href={pagePath('cookies')}>{t("Privacy Policy")}</a>
    </dialog>
  </ConsentContext.Provider>
}

export function CookieSettingsButton() {
  useLocale()
  const { openSettings } = useCookieConsent()
  return <button type="button" onClick={openSettings}>{t("Cookie settings")}</button>
}
