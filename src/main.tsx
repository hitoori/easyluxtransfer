import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './fonts.css'
import './index.css'
import { CookieConsentProvider } from './components/CookieConsent'
import { getLanguage, loadLanguage, LocaleProvider } from './i18n/locale'
import { legacyPageDestination } from './lib/legacyNavigation'

const legacyDestination = legacyPageDestination(window.location)
if (legacyDestination) {
  // Fetch the destination's prerendered HTML before React hydrates any Home markup.
  window.location.replace(legacyDestination)
} else {
  const root = document.getElementById('root')!
  const app = <React.StrictMode><LocaleProvider><CookieConsentProvider><App /></CookieConsentProvider></LocaleProvider></React.StrictMode>
  loadLanguage(getLanguage()).then(() => {
    if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app)
    else ReactDOM.createRoot(root).render(app)
  }).catch(error => console.error('Could not load website language', error))
}
