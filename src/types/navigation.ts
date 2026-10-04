import { getLanguage, type Language } from '../i18n/translate'
export type Page = 'home' | 'services' | 'about' | 'faq' | 'contact' | 'cookies'

export const pagePath = (page: Page, language: Language = getLanguage()) => `${language === 'ru' ? '/ru' : ''}${page === 'home' ? (language === 'ru' ? '' : '/') : `/${page}`}`

export interface NavigationItem {
  label: string
  page: Page
}
