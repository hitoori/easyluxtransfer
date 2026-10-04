import { getLocale, t } from '../i18n/translate'
export type BookingService = 'transfer' | 'hourly' | 'tours'

export interface BookingExtra {
  id: string
  name: string
  description: string
  price: number | null
  currency: 'EUR'
  unit: string
  estimated: boolean
  enabled: boolean
  quantity: boolean
  services: BookingService[]
  previewOnly: boolean
}

// Approved mock-up estimates. Production builds show Price on request until
// final rates are approved and previewOnly is explicitly removed.
export const bookingExtras: BookingExtra[] = [
  { id: 'prosecco', name: 'Prosecco bottle', description: 'Bottle only; winery visits are separate.', price: 50, currency: 'EUR', unit: 'bottle', estimated: true, enabled: true, quantity: true, services: ['transfer', 'hourly', 'tours'], previewOnly: true },
  { id: 'wine', name: 'Wine bottle', description: 'A bottle for your journey.', price: 40, currency: 'EUR', unit: 'bottle', estimated: true, enabled: true, quantity: true, services: ['transfer', 'hourly', 'tours'], previewOnly: true },
  { id: 'refreshments', name: 'Snacks & refreshments', description: 'Contents confirmed; water is complimentary.', price: 24, currency: 'EUR', unit: 'package', estimated: true, enabled: true, quantity: true, services: ['transfer', 'hourly', 'tours'], previewOnly: true },
  { id: 'waiting', name: 'Additional waiting', description: 'Beyond the included waiting time.', price: 30, currency: 'EUR', unit: 'hour', estimated: true, enabled: true, quantity: true, services: ['transfer'], previewOnly: true },
]

export const extraPrice = (extra: BookingExtra) => extra.previewOnly && !import.meta.env.DEV ? null : extra.price
export const euro = (amount: number) => new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)
export const extraPriceLabel = (extra: BookingExtra) => {
  const price = extraPrice(extra)
  return price === null ? 'Price on request' : `${extra.estimated ? t('Est. ') : ''}${euro(price)} / ${t(extra.unit)}`
}
