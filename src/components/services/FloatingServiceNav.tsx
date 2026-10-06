import { message, t, useLocale } from '../../i18n/locale'
import { useEffect, useRef, useState } from 'react'
import type { JourneyService } from './serviceData'
import './floating-service-nav.css'
import PageLink from '../PageLink'

const items = [
  ['airport', 'Airport & City'],
  ['hourly', 'By the Hour'],
  ['water-taxi', 'Water Taxi'],
  ['europe', 'Italy & Europe'],
  ['prosecco', 'Prosecco Hills'],
  ['mountains', 'Mountains'],
  ['coast', 'Seaside'],
  ['cruise', 'Cruise Ports'],
] as const
export default function FloatingServiceNav({ activeSection, onSelect }: {
  activeSection: JourneyService | null
  onSelect: (id: string) => void
}) {
  useLocale()
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const currentButton = useRef<HTMLButtonElement>(null)
  const activeIndex = Math.max(0, items.findIndex(([id]) => id === activeSection))

  useEffect(() => {
    const element = dialog.current
    if (open && element && !element.open) element.showModal()
    if (!open && element?.open) element.close()
  }, [open])

  const hide = () => {
    setOpen(false)
    setCollapsed(true)
    requestAnimationFrame(() => currentButton.current?.focus())
  }
  const choose = (id: string) => {
    setOpen(false)
    setCollapsed(false)
    onSelect(id)
    requestAnimationFrame(() => currentButton.current?.focus())
  }
  const links = () => items.map(([id, label]) =>
    <PageLink key={id} page="services" sectionId={`service-${id}`} navigate={() => choose(id)} className="fsn-link"
      aria-current={id === activeSection ? 'location' : undefined}
      aria-label={message("Go to {0}", t(label))}>
      <span className="fsn-stop" aria-hidden="true" />
      <span>{t(label)}</span>
    </PageLink>)

  return <>
    <nav className={`fsn fsn-trigger${collapsed ? ' is-collapsed' : ''}`} aria-label={t("Services navigation")} hidden={open}>
      <button ref={currentButton} className="fsn-current" type="button" onClick={() => { setCollapsed(false); setOpen(true) }} aria-haspopup="dialog" aria-expanded={open} aria-controls="floating-services-dialog" aria-label={message("Open services navigation. Current section: {0}", t(items[activeIndex][1]))}>
          <span className="fsn-stop" aria-hidden="true" /><span className="fsn-current-name">{t(items[activeIndex][1])}</span><span className="fsn-arrow-desktop" aria-hidden="true">{"←"}</span><span className="fsn-arrow-phone" aria-hidden="true">{"↑"}</span>
      </button>
      {!collapsed && <button className="fsn-close fsn-close-phone" type="button" onClick={hide} aria-label={t("Hide services navigation")}>{"×"}</button>}
    </nav>
    <dialog ref={dialog} id="floating-services-dialog" className="fsn fsn-dialog" aria-labelledby="floating-services-title"
      onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
      onClick={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <div className="fsn-dialog-content">
        <div className="fsn-dialog-heading"><h2 id="floating-services-title">{t("SERVICES")}</h2><button type="button" className="fsn-close" onClick={() => setOpen(false)} aria-label={t("Close services navigation")}>{"×"}</button></div>
        <nav className="fsn-list" aria-label={t("Choose a service")}>{links()}</nav>
      </div>
    </dialog>
  </>
}
