import { createContext, useContext, useState, type ReactNode } from 'react'
import { getLanguage, type Language } from './translate'
export { countLabel, getLanguage, getLocale, languageFromPath, loadLanguage, message, t, withRenderLanguage, type Language } from './translate'

const LocaleContext = createContext({ language: 'en' as Language, syncLanguage: () => {} })
export function LocaleProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguage] = useState(initialLanguage ?? getLanguage)
  return <LocaleContext.Provider value={{ language, syncLanguage: () => setLanguage(getLanguage()) }}>{children}</LocaleContext.Provider>
}
export const useLocale = () => useContext(LocaleContext)
