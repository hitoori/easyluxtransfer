export interface TransferRoute {
  id: string
  from: string
  to: string
  pickup: string
  destination: string
  airportMode?: 'pickup' | 'dropoff'
  sedan: number
  van: number
  minibus: number
}

export const transferRoutes: TransferRoute[] = [
  {
    id: 'marco-polo-piazzale-roma',
    from: 'Marco Polo Airport',
    to: 'Piazzale Roma, Venice',
    pickup: 'Venice Marco Polo Airport (VCE)',
    destination: 'Piazzale Roma, Venice',
    airportMode: 'pickup',
    sedan: 70,
    van: 80,
    minibus: 150,
  },
  { id: 'venice-treviso', from: 'Venice', to: 'Treviso TV', pickup: 'Venice', destination: 'Treviso TV', sedan: 110, van: 130, minibus: 220 },
  { id: 'venice-mestre', from: 'Venice', to: 'Mestre VE', pickup: 'Venice', destination: 'Mestre VE', sedan: 65, van: 70, minibus: 130 },
  { id: 'venice-chioggia', from: 'Venice', to: 'Chioggia VE', pickup: 'Venice', destination: 'Chioggia VE', sedan: 190, van: 220, minibus: 380 },
  { id: 'venice-padova', from: 'Venice', to: 'Padova PD', pickup: 'Venice', destination: 'Padova PD', sedan: 140, van: 160, minibus: 300 },
  { id: 'venice-ravenna-cruise-port', from: 'Venice', to: 'Ravenna Cruise Port', pickup: 'Venice', destination: 'Ravenna Cruise Port', sedan: 440, van: 500, minibus: 900 },
  { id: 'venice-milan', from: 'Venice', to: 'Milan', pickup: 'Venice', destination: 'Milan', sedan: 670, van: 800, minibus: 1400 },
  { id: 'venice-florence', from: 'Venice', to: 'Florence', pickup: 'Venice', destination: 'Florence', sedan: 720, van: 790, minibus: 1500 },
  { id: 'venice-rome', from: 'Venice', to: 'Rome', pickup: 'Venice', destination: 'Rome', sedan: 1400, van: 1600, minibus: 2800 },
  { id: 'venice-cortina', from: 'Venice', to: 'Cortina d’Ampezzo', pickup: 'Venice', destination: 'Cortina d’Ampezzo', sedan: 400, van: 450, minibus: 800 },
  { id: 'venice-verona', from: 'Venice', to: 'Verona VR', pickup: 'Venice', destination: 'Verona VR', sedan: 350, van: 400, minibus: 700 },
  { id: 'venice-corvara', from: 'Venice', to: 'Corvara BZ', pickup: 'Venice', destination: 'Corvara BZ', sedan: 800, van: 900, minibus: 1560 },
  { id: 'venice-canazei', from: 'Venice', to: 'Canazei BZ', pickup: 'Venice', destination: 'Canazei BZ', sedan: 550, van: 630, minibus: 1100 },
  { id: 'venice-ortisei', from: 'Venice', to: 'Ortisei BZ', pickup: 'Venice', destination: 'Ortisei BZ', sedan: 600, van: 700, minibus: 1200 },
  { id: 'venice-lido-di-jesolo', from: 'Venice', to: 'Lido di Jesolo VE', pickup: 'Venice', destination: 'Lido di Jesolo VE', sedan: 145, van: 170, minibus: 310 },
  { id: 'venice-trieste-cruise-port', from: 'Venice', to: 'Trieste Cruise Port', pickup: 'Venice', destination: 'Trieste Cruise Port', sedan: 390, van: 450, minibus: 800 },
  { id: 'venice-cavallino-treporti', from: 'Venice', to: 'Cavallino-Treporti VE', pickup: 'Venice', destination: 'Cavallino-Treporti VE', sedan: 145, van: 170, minibus: 290 },
  { id: 'venice-bolzano', from: 'Venice', to: 'Bolzano BZ', pickup: 'Venice', destination: 'Bolzano BZ', sedan: 620, van: 680, minibus: 1240 },
  { id: 'venice-caorle', from: 'Venice', to: 'Caorle VE', pickup: 'Venice', destination: 'Caorle VE', sedan: 170, van: 200, minibus: 380 },
  { id: 'venice-fusina-cruise-terminal', from: 'Venice', to: 'Fusina Cruise Terminal VE', pickup: 'Venice', destination: 'Fusina Cruise Terminal VE', sedan: 100, van: 120, minibus: 220 },
  { id: 'venice-trento', from: 'Venice', to: 'Trento', pickup: 'Venice', destination: 'Trento', sedan: 460, van: 500, minibus: 950 },
  { id: 'venice-abano-terme', from: 'Venice', to: 'Abano Terme PD', pickup: 'Venice', destination: 'Abano Terme PD', sedan: 150, van: 190, minibus: 320 },
  { id: 'venice-adria', from: 'Venice', to: 'Adria', pickup: 'Venice', destination: 'Adria', sedan: 200, van: 220, minibus: 400 },
  { id: 'venice-albarella', from: 'Venice', to: 'Albarella', pickup: 'Venice', destination: 'Albarella', sedan: 240, van: 280, minibus: 500 },
  { id: 'venice-alleghe', from: 'Venice', to: 'Alleghe BL', pickup: 'Venice', destination: 'Alleghe BL', sedan: 390, van: 450, minibus: 800 },
  { id: 'venice-alpe-di-siusi', from: 'Venice', to: 'Alpe di Siusi', pickup: 'Venice', destination: 'Alpe di Siusi', sedan: 750, van: 820, minibus: 1500 },
  { id: 'venice-conegliano', from: 'Venice', to: 'Conegliano TV', pickup: 'Venice', destination: 'Conegliano TV', sedan: 160, van: 180, minibus: 330 },
  { id: 'venice-alta-badia', from: 'Venice', to: 'Alta Badia', pickup: 'Venice', destination: 'Alta Badia', sedan: 550, van: 650, minibus: 1170 },
  { id: 'venice-arabba', from: 'Venice', to: 'Arabba', pickup: 'Venice', destination: 'Arabba', sedan: 550, van: 650, minibus: 1170 },
  { id: 'venice-bardolino', from: 'Venice', to: 'Bardolino', pickup: 'Venice', destination: 'Bardolino', sedan: 390, van: 450, minibus: 800 },
]

const popularRouteIds = [
  'venice-ravenna-cruise-port',
  'venice-fusina-cruise-terminal',
  'venice-cortina',
  'venice-trieste-cruise-port',
  'venice-lido-di-jesolo',
  'venice-trento',
  'venice-cavallino-treporti',
  'venice-treviso',
  'venice-corvara',
  'venice-bolzano',
]

const routesById = new Map(transferRoutes.map((route) => [route.id, route]))

export const popularTransferRoutes = popularRouteIds.flatMap((id) => {
  const route = routesById.get(id)
  return route ? [route] : []
})
