import { getLocale } from '../../i18n/translate'
import { transferRoutes } from '../../data/transferRoutes'

export const serviceOptions = [
  ['airport', 'Airport & City'], ['hourly', 'By the Hour'], ['water-taxi', 'Water Taxi'],
  ['europe', 'Italy & Europe'], ['prosecco', 'Prosecco Hills'], ['mountains', 'Mountains'], ['coast', 'Seaside'],
  ['cruise', 'Cruise Ports'], ['custom', 'Custom destination'],
] as const
export type JourneyService = typeof serviceOptions[number][0]
export interface JourneyRequest { service: JourneyService; pickup?: string; destination?: string; airportPickup?: boolean; addReturn?: boolean }
export interface QuoteSelection extends JourneyRequest { revision: number }

const routeMap = new Map(transferRoutes.map(route => [route.id, route]))
export const serviceRoutes = (ids: string[]) => ids.map(id => {
  const route = routeMap.get(id)
  if (!route) throw new Error(`Missing supplied route: ${id}`)
  return { ...route, to: route.to.replace(/ (TV|VE|PD|VR|BZ|BL)$/, '').replace('Cavallino Treporti', 'Cavallino-Treporti') }
})
export const cityRoutes = serviceRoutes(['venice-treviso', 'venice-padova', 'venice-abano-terme'])
export const italyRoutes = serviceRoutes(['venice-milan', 'venice-florence', 'venice-rome', 'venice-verona', 'venice-conegliano', 'venice-bardolino', 'venice-treviso', 'venice-padova', 'venice-abano-terme'])
export const mountainRoutes = serviceRoutes(['venice-cortina', 'venice-corvara', 'venice-canazei', 'venice-ortisei', 'venice-bolzano', 'venice-trento', 'venice-alleghe', 'venice-alpe-di-siusi', 'venice-alta-badia', 'venice-arabba'])
export const coastalRoutes = serviceRoutes(['venice-lido-di-jesolo', 'venice-cavallino-treporti', 'venice-caorle', 'venice-chioggia', 'venice-adria', 'venice-albarella'])
export const cruiseRoutes = serviceRoutes(['venice-ravenna-cruise-port', 'venice-trieste-cruise-port', 'venice-fusina-cruise-terminal'])
export const priceLabel = (amount: number) => `€${new Intl.NumberFormat(getLocale()).format(amount)}`
