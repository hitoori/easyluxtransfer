import { t, useLocale } from '../i18n/locale'
import { addressSuggestionsConfigured, useCookieConsent } from './CookieConsent'
import './place-input.css'

export default function AddressSuggestionsConsent() {
  useLocale()
  const { maps, analytics, save } = useCookieConsent()
  if (!addressSuggestionsConfigured || maps) return null

  return <div className="address-suggestions-consent">
    <p>{t('Google suggestions are off. You can enter addresses manually or enable suggestions.')} <span>{t('Enabling suggestions sends your address searches and connection data to Google.')}</span></p>
    <button type="button" onClick={event => {
      const field = event.currentTarget.closest('[data-booking-dock], form')?.querySelector<HTMLInputElement>('input[role="combobox"]')
      save(true, analytics)
      window.requestAnimationFrame(() => field?.focus())
    }}>{t('Enable Google suggestions')}</button>
  </div>
}
