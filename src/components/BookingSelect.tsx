import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, CaretDown } from '@phosphor-icons/react'
import { t, useLocale } from '../i18n/locale'
import './booking-select.css'

interface BookingSelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly (readonly [T, string])[]
  label: string
  showLabel?: boolean
  inline?: boolean
  id?: string
  invalid?: boolean
  describedBy?: string
  className?: string
}

export default function BookingSelect<T extends string>({ value, onChange, options, label, showLabel = true, inline = false, id: suppliedId, invalid, describedBy, className = '' }: BookingSelectProps<T>) {
  useLocale()
  const generatedId = useId()
  const id = suppliedId ?? `${generatedId}-trigger`
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const search = useRef({ text: '', time: 0 })
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 340 })
  const selected = options.findIndex(([service]) => service === value)
  const close = () => { menu.current?.hidePopover(); trigger.current?.focus() }
  const focusOption = (index: number) => {
    const list = menu.current
    const option = list?.querySelectorAll<HTMLButtonElement>('[role="option"]')[index]
    if (!list || !option) return
    option.focus({ preventScroll: true })
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight
  }
  const prepare = () => {
    const desktopInline = inline && window.matchMedia('(min-width: 761px)').matches
    const anchor = desktopInline ? trigger.current?.closest('.booking-field') ?? trigger.current : trigger.current
    const bounds = anchor?.getBoundingClientRect()
    if (!bounds || menu.current?.matches(':popover-open')) return
    const below = window.innerHeight - bounds.bottom - 16
    const above = bounds.top - 16
    const upwards = !desktopInline && below < 220 && above > below
    const height = Math.max(0, Math.min(340, upwards ? above : below))
    setPosition({ top: upwards ? bounds.top - height - 6 : bounds.bottom + 6, left: bounds.left, width: bounds.width, maxHeight: height })
  }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])]
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    let next: number | undefined
    if (event.key === 'ArrowDown') next = (current + 1) % buttons.length
    else if (event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = buttons.length - 1
    else if (event.key === 'Tab') { menu.current?.hidePopover(); return }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== ' ') {
      const now = Date.now()
      search.current = { text: (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase(), time: now }
      const match = options.findIndex(([, label]) => t(label).toLocaleLowerCase().startsWith(search.current.text))
      if (match >= 0) next = match
    }
    if (next !== undefined) { event.preventDefault(); focusOption(next) }
  }
  useEffect(() => {
    if (!open) return
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && menu.current?.contains(event.target)) return
      if (menu.current?.matches(':popover-open')) menu.current.hidePopover()
    }
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => { window.removeEventListener('resize', dismiss); window.removeEventListener('scroll', dismiss, true) }
  }, [open])

  return <div className="booking-select">
    {showLabel && <label className="services-booking-label" id={`${id}-label`} htmlFor={id}>{t(label)}</label>}
    <button ref={trigger} id={id} type="button" role="combobox" aria-label={t(label)} aria-invalid={invalid} aria-describedby={describedBy} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-menu`} popoverTarget={`${id}-menu`} className={`booking-select-trigger ${inline ? 'booking-select-trigger--inline' : ''} ${className}`} onClick={prepare} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); prepare(); if (!menu.current?.matches(':popover-open')) menu.current?.showPopover() }
    }}><span>{t(options[selected]?.[1] ?? value)}</span><CaretDown size={19} aria-hidden="true" /></button>
    <div ref={menu} id={`${id}-menu`} popover="auto" role="listbox" aria-label={showLabel ? undefined : t(label)} aria-labelledby={showLabel ? `${id}-label` : undefined} className="booking-select-menu" style={position} onKeyDown={keyDown} onToggle={event => {
      const visible = event.newState === 'open'
      setOpen(visible)
      if (visible) requestAnimationFrame(() => focusOption(selected))
    }}>
      {options.map(([service, label]) => <button key={service} type="button" role="option" tabIndex={-1} aria-selected={value === service} onClick={() => { onChange(service); close() }}><span>{t(label)}</span>{value === service && <Check size={18} weight="bold" aria-hidden="true" />}</button>)}
    </div>
  </div>
}
