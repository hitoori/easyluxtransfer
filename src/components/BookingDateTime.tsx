import { getLocale, message, t, useLocale } from '../i18n/locale'
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react'
import { CalendarBlank, X } from '@phosphor-icons/react'
import './booking-date-time.css'

const BookingCalendar = lazy(() => import('./BookingCalendar'))
type Kind = 'datetime' | 'date' | 'time'
interface Props {
  id?: string
  value: string
  min?: string
  label: string
  kind?: Kind
  dock?: boolean
  invalid?: boolean
  describedBy?: string
  onChange: (value: string) => void
}
const pad = (value: number) => String(value).padStart(2, '0')
const dateString = (day: Date) => `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
function dayFrom(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return undefined
  const day = new Date(`${value.slice(0, 10)}T00:00`)
  return Number.isNaN(day.getTime()) ? undefined : day
}
const displayDate = (value: string, kind: Kind) => {
  if (!value) return kind === 'time' ? 'Select time' : kind === 'date' ? 'Select date' : 'Select date & time'
  if (kind === 'time') return value
  const day = dayFrom(value)
  return day ? `${new Intl.DateTimeFormat(getLocale(), { day: '2-digit', month: 'short', year: 'numeric' }).format(day)}${kind === 'datetime' ? ` · ${value.slice(11, 16)}` : ''}` : 'Select date'
}

export default function BookingDateTime({ id, value, min = '', label, kind = 'datetime', dock = false, invalid = false, describedBy, onChange }: Props) {
  useLocale()
  const generatedId = useId()
  const popupId = `${generatedId}-calendar`
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState(() => dayFrom(value) ?? dayFrom(min) ?? new Date())
  const [month, setMonth] = useState(day)
  const [time, setTime] = useState('09:00')
  const [position, setPosition] = useState({ left: 12, top: 12 })
  const minDay = dayFrom(min)
  const minimumTime = kind === 'time' ? min : min.slice(11, 16)
  const candidate = kind === 'time' ? time : `${dateString(day)}${kind === 'datetime' ? `T${time}` : ''}`
  const tooEarly = Boolean(min && candidate < min)

  const close = () => {
    if (popup.current?.matches(':popover-open')) popup.current.hidePopover()
    trigger.current?.focus({ preventScroll: true })
  }
  const positionPopup = (height: number) => {
    if (!trigger.current) return
    const bounds = trigger.current.getBoundingClientRect()
    const width = Math.min(320, window.innerWidth - 24)
    const visibleHeight = Math.min(height, window.innerHeight - 24)
    const below = window.innerHeight - bounds.bottom - 12
    const top = below >= visibleHeight + 8 ? bounds.bottom + 8 : bounds.top >= visibleHeight + 20 ? bounds.top - visibleHeight - 8 : Math.max(12, Math.min(bounds.bottom + 8, window.innerHeight - visibleHeight - 12))
    const left = Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12))
    setPosition(previous => previous.left === left && previous.top === top ? previous : { left, top })
  }
  const prepare = () => {
    if (popup.current?.matches(':popover-open')) return
    const initialDay = dayFrom(value) ?? minDay ?? new Date()
    const nextDay = minDay && initialDay < minDay ? minDay : initialDay
    const initialTime = (kind === 'time' ? value : value.slice(11, 16)) || '09:00'
    setDay(nextDay)
    setMonth(nextDay)
    setTime(minimumTime && (kind === 'time' || dateString(nextDay) === min.slice(0, 10)) && initialTime < minimumTime ? minimumTime : initialTime)
    positionPopup(kind === 'time' ? 190 : kind === 'date' ? 410 : 510)
  }
  useEffect(() => {
    if (!open) return
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && popup.current?.contains(event.target)) return
      if (popup.current?.matches(':popover-open')) popup.current.hidePopover()
    }
    const observer = new ResizeObserver(() => {
      if (popup.current) positionPopup(popup.current.getBoundingClientRect().height)
    })
    if (popup.current) observer.observe(popup.current)
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', dismiss); window.removeEventListener('scroll', dismiss, true) }
  }, [open])

  return <>
    <button ref={trigger} id={id} type="button" className={`booking-date-trigger${dock ? ' booking-date-trigger--dock' : ''}`} aria-label={t(label)} aria-invalid={invalid} aria-describedby={describedBy} aria-haspopup="dialog" aria-expanded={open} aria-controls={popupId} popoverTarget={popupId} onClick={prepare}>
      {dock && <CalendarBlank size={23} weight="light" aria-hidden="true" />}
      <span className="booking-date-text">{dock && <span className="booking-date-label">{t(label)}</span>}<span className={`booking-date-value${value ? '' : ' is-empty'}`}>{t(displayDate(value, kind))}</span></span>
      {!dock && <CalendarBlank size={17} weight="light" aria-hidden="true" />}
    </button>
    <div ref={popup} id={popupId} popover="auto" role="dialog" aria-label={message("Choose {0}", t(t(label).toLowerCase()))} className="booking-date-popup" style={position} onToggle={event => setOpen(event.newState === 'open')}>
      <div className="booking-date-heading"><span>{t(kind === 'time' ? 'Choose time' : kind === 'date' ? 'Choose date' : 'Choose date & time')}</span><button type="button" aria-label={t("Close date picker")} onClick={close}><X size={16} aria-hidden="true" /></button></div>
      {open && kind !== 'time' && <Suspense fallback={<div className="booking-calendar-loading" role="status">{t("Loading calendar…")}</div>}><BookingCalendar selected={day} month={month} onMonthChange={setMonth} min={minDay} onSelect={next => {
        setDay(next)
        if (minimumTime && dateString(next) === min.slice(0, 10) && time < minimumTime) setTime(minimumTime)
      }} /></Suspense>}
      {kind !== 'date' && <div className="booking-time-selects">
        <label>{t("Hour")}<select aria-label={t("Hour")} value={time.slice(0, 2)} onChange={event => setTime(`${event.target.value}:${time.slice(3, 5)}`)}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={pad(hour)}>{pad(hour)}</option>)}</select></label>
        <label>{t("Minute")}<select aria-label={t("Minute")} value={time.slice(3, 5)} onChange={event => setTime(`${time.slice(0, 2)}:${event.target.value}`)}>{Array.from({ length: 60 }, (_, minute) => <option key={minute} value={pad(minute)}>{pad(minute)}</option>)}</select></label>
      </div>}
      {tooEarly && <p className="booking-date-error" role="status">{t("Choose ")}{t(kind === 'time' ? 'a later time' : 'a date and time after the minimum')}{"."}</p>}
      <div className="booking-date-actions"><button type="button" onClick={() => { onChange(''); close() }}>{t("Clear")}</button><button type="button" disabled={tooEarly} onClick={() => { onChange(candidate); close() }}>{t(kind === 'time' ? 'Use time' : kind === 'date' ? 'Use date' : 'Use date & time')}</button></div>
    </div>
  </>
}
