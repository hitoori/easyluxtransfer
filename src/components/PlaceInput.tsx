import { message, t, useLocale } from '../i18n/locale'
import OptimizedImage from './OptimizedImage'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useCookieConsent } from './CookieConsent'
import './place-input.css'

const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
let placesLibrary: Promise<google.maps.PlacesLibrary> | undefined
function loadPlaces() {
  return placesLibrary ??= import('@googlemaps/js-api-loader').then(({ setOptions, importLibrary }) => {
    setOptions({ key: mapsKey!, v: 'weekly' })
    return importLibrary('places')
  }).catch(error => { placesLibrary = undefined; throw error })
}

type Prediction = google.maps.places.PlacePrediction

export interface PlaceMetadata {
  placeId: string
  types: string[]
  latitude?: number
  longitude?: number
}

interface PlaceInputProps {
  value: string
  onChange: (value: string) => void
  className: string
  placeholder: string
  label: string
  invalid?: boolean
  onMetadataChange?: (metadata: PlaceMetadata | null) => void
  inputId?: string
  describedBy?: string
}

export default function PlaceInput({ value, onChange, className, placeholder, label, invalid, onMetadataChange, inputId, describedBy }: PlaceInputProps) {
  const { language } = useLocale()
  const { maps: mapsAllowed } = useCookieConsent()
  const [suggestions, setSuggestions] = useState<Prediction[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [available, setAvailable] = useState(Boolean(mapsKey))
  const listId = useId()
  const input = useRef<HTMLInputElement>(null)
  const popup = useRef<HTMLSpanElement>(null)
  const [position, setPosition] = useState({ left: 12, top: 12, width: 320, maxHeight: 320 })
  const visible = open && suggestions.length > 0
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const requestId = useRef(0)
  const selectedValue = useRef('')
  const selectionId = useRef(0)
  const blurTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => { selectionId.current++; window.clearTimeout(blurTimer.current) }, [])

  useLayoutEffect(() => {
    const list = popup.current
    const field = input.current
    if (!visible || !list || !field) return
    // The top layer escapes the hero's clipping and the booking dialog's scroll container.
    const placePopup = () => {
      const bounds = field.getBoundingClientRect()
      const viewport = window.visualViewport
      const viewportLeft = viewport?.offsetLeft ?? 0
      const viewportTop = viewport?.offsetTop ?? 0
      const viewportWidth = viewport?.width ?? window.innerWidth
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight)
      if (bounds.bottom < viewportTop || bounds.top > viewportBottom) { setOpen(false); return }
      const width = Math.min(Math.max(bounds.width, 300), 420, viewportWidth - 24)
      const below = Math.max(0, viewportBottom - bounds.bottom - 20)
      const above = Math.max(0, bounds.top - viewportTop - 20)
      const options = list.querySelector<HTMLElement>('.place-suggestion-options')
      const attribution = list.querySelector<HTMLElement>('.place-google-attribution')
      const contentHeight = (options?.scrollHeight ?? list.scrollHeight) + (attribution?.offsetHeight ?? 0)
      const belowPreferred = below >= Math.min(contentHeight, 340) || below >= above
      const maxHeight = Math.min(340, belowPreferred ? below : above)
      const height = Math.min(contentHeight, maxHeight)
      const left = Math.max(viewportLeft + 12, Math.min(bounds.left, viewportLeft + viewportWidth - width - 12))
      const top = belowPreferred ? bounds.bottom + 8 : bounds.top - height - 8
      setPosition(previous => previous.left === left && previous.top === top && previous.width === width && previous.maxHeight === maxHeight ? previous : { left, top, width, maxHeight })
    }
    const reposition = (event: Event) => {
      if (event.target instanceof Node && list.contains(event.target)) return
      placePopup()
    }
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !list.contains(event.target) && event.target !== field) setOpen(false)
    }
    list.showPopover()
    placePopup()
    const observer = new ResizeObserver(placePopup)
    observer.observe(field)
    observer.observe(list)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    document.addEventListener('pointerdown', dismiss)
    return () => {
      if (list.matches(':popover-open')) list.hidePopover()
      observer.disconnect()
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      window.visualViewport?.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('scroll', reposition)
      document.removeEventListener('pointerdown', dismiss)
    }
  }, [visible, suggestions])

  useEffect(() => {
    if (visible && active >= 0) popup.current?.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, visible])

  useEffect(() => {
    if (!mapsAllowed || !mapsKey || !open || value.trim().length < 3 || value === selectedValue.current) {
      setSuggestions([])
      session.current = null
      return
    }
    const id = ++requestId.current
    const timer = window.setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = await loadPlaces()
        session.current ??= new AutocompleteSessionToken()
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          language,
          region: 'it',
          locationBias: { center: { lat: 45.4408, lng: 12.3155 }, radius: 50000 },
          sessionToken: session.current,
        })
        if (id === requestId.current) { setAvailable(true); setSuggestions(result.suggestions.flatMap(item => item.placePrediction ? [item.placePrediction] : [])) }
      } catch {
        if (id === requestId.current) {
          setSuggestions([])
          setAvailable(false)
        }
      }
    }, 300)
    return () => { window.clearTimeout(timer); requestId.current++ }
  }, [value, open, mapsAllowed, language])

  const choose = async (prediction: Prediction) => {
    const selection = ++selectionId.current
    const text = prediction.text.toString()
    selectedValue.current = text
    onChange(text)
    onMetadataChange?.(null)
    setOpen(false)
    setSuggestions([])
    setActive(-1)
    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: onMetadataChange ? ['formattedAddress', 'types', 'location'] : ['formattedAddress'] })
      if (selection !== selectionId.current) return
      if (place.formattedAddress) {
        selectedValue.current = place.formattedAddress
        onChange(place.formattedAddress)
      }
      onMetadataChange?.({ placeId: prediction.placeId, types: place.types ?? [], latitude: place.location?.lat(), longitude: place.location?.lng() })
    } catch { /* Keep the selected prediction as a usable address. */ }
    session.current = null
  }

  return <span className="relative block">
    <input
      ref={input}
      type="text"
      id={inputId}
      value={value}
      onChange={event => { selectionId.current++; selectedValue.current = ''; onMetadataChange?.(null); onChange(event.target.value); setOpen(true); setActive(-1) }}
      onFocus={() => { window.clearTimeout(blurTimer.current); setOpen(true) }}
      onBlur={() => { if (input.current) input.current.scrollLeft = 0; window.clearTimeout(blurTimer.current); blurTimer.current = window.setTimeout(() => setOpen(false), 150) }}
      onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); setActive(-1) }
        if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setActive((active + 1) % suggestions.length) }
        if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setActive((active + suggestions.length - 1) % suggestions.length) }
        if (event.key === 'Enter' && open && active >= 0 && suggestions[active]) { event.preventDefault(); void choose(suggestions[active]) }
      }}
      placeholder={t(placeholder)}
      title={value || undefined}
      className={`place-input ${className}`}
      autoComplete="off"
      aria-label={t(label)}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      aria-expanded={visible}
      aria-controls={visible ? listId : undefined}
      aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
      aria-autocomplete={mapsAllowed && available ? 'list' : 'none'}
      role="combobox"
    />
    {mapsAllowed && mapsKey && !available && <span className="place-input-unavailable" role="status">{t('Google suggestions are temporarily unavailable. You can still enter the address manually.')}</span>}
    {visible && <span ref={popup} id={listId} popover="manual" role="listbox" aria-label={message('{0} suggestions', t(label))} className="place-suggestions" style={position}>
      <span className="place-suggestion-options">{suggestions.map((item, index) => <button key={item.placeId} id={`${listId}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={index === active} onPointerDown={event => event.preventDefault()} onClick={() => void choose(item)}>{item.text.toString()}</button>)}</span>
      <span className="place-google-attribution"><OptimizedImage src={`${import.meta.env.BASE_URL}images/powered_by_google_on_white.png`} alt={t("Powered by Google")} width={59} height={18} className="h-[18px] w-auto" /></span>
    </span>}
  </span>
}
