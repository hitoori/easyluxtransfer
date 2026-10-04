import { t, useLocale } from '../i18n/locale'
import { Component, type ReactNode } from 'react'

export default class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <div className="min-h-[70vh] px-6 pt-36 text-center" role="alert">
      <h1 className="font-display text-4xl">{t("This page could not load.")}</h1>
      <p className="mt-5">{t("Please check your connection and try again.")}</p>
      <button type="button" className="mt-6 border border-gold px-6 py-3 text-gold" onClick={() => window.location.reload()}>{t("Reload page")}</button>
    </div> : this.props.children
  }
}
