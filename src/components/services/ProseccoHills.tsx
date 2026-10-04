import { t, useLocale } from '../../i18n/locale'
import OptimizedImage from '../OptimizedImage'
import { useEffect, useRef } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import type { JourneyRequest } from './serviceData'
import './prosecco-hills.css'

export default function ProseccoHills({ onRequest }: { onRequest: (request: JourneyRequest) => void }) {
  useLocale()
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      frame = 0
      if (reducedMotion.matches) return
      const bounds = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      if (bounds.bottom < 0 || bounds.top > viewportHeight) return
      const progress = (viewportHeight - bounds.top) / (viewportHeight + bounds.height)
      section.style.setProperty('--ph-parallax-y', `${((progress - .5) * 120).toFixed(1)}px`)
    }
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const syncMotion = () => {
      window.removeEventListener('scroll', scheduleUpdate)
      if (reducedMotion.matches) section.style.setProperty('--ph-parallax-y', '0px')
      else {
        window.addEventListener('scroll', scheduleUpdate, { passive: true })
        scheduleUpdate()
      }
    }

    syncMotion()
    reducedMotion.addEventListener('change', syncMotion)
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      reducedMotion.removeEventListener('change', syncMotion)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return <section ref={sectionRef} id="service-prosecco" className="ph-section" aria-labelledby="prosecco-title">
    <OptimizedImage className="ph-backdrop" src={publicAsset('images/home/private-journeys/prosecco-hills.jpg')} alt={""} aria-hidden="true" width={2400} height={1601} loading="lazy" decoding="async" />
    <div className="ph-shell">
      <div className="ph-copy">
        <p className="ph-eyebrow">{t("PROSECCO HILLS · VENETO")}</p>
        <h2 id="prosecco-title">{t("From Venice to the Prosecco Hills.")}</h2>
        <p className="ph-description">{t("Private transfers from Venice to Conegliano, Valdobbiadene or another destination in the Prosecco Hills.")}</p>
      </div>
    </div>
    <div className="ph-footer">
      <p className="ph-route"><span>{t("Venice")}</span><span className="ph-route-arrow" aria-hidden="true">{"→"}</span><span>{t("Conegliano")}</span><span className="ph-route-arrow" aria-hidden="true">{"→"}</span><span>{t("Valdobbiadene")}</span></p>
      <p className="ph-note">{t("One-way or return, with waiting time on request. Winery visits, tastings and guided tours are not included.")}</p>
      <button type="button" className="ph-cta" onClick={() => onRequest({ service: 'prosecco', pickup: 'Venice', destination: 'Prosecco Hills' })}>{t("Plan your trip ")}<ArrowRight size={19} weight="light" aria-hidden="true" /></button>
    </div>
  </section>
}
import { publicAsset } from '../../lib/publicAsset'
