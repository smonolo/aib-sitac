export const SYMBOL_IDS = [
  'hotspot',
  'active_front',
  'burned_area',
  'water_point',
  'lookout',
  'command_post',
  'vehicle',
  'squad',
  'road_closed',
  'wind',
  'note',
] as const

export type SymbolId = (typeof SYMBOL_IDS)[number]

export type GeometryKind = 'point' | 'line' | 'arrow' | 'polygon' | 'text'

export type SymbolDef = {
  id: SymbolId
  geometry: GeometryKind
  color: string
  labelIt: string
  labelEn: string
}

export const SYMBOL_CATALOG: readonly SymbolDef[] = [
  {
    id: 'hotspot',
    geometry: 'point',
    color: '#AF2525',
    labelIt: 'Hotspot',
    labelEn: 'Hotspot',
  },
  {
    id: 'active_front',
    geometry: 'arrow',
    color: '#E85D04',
    labelIt: 'Fronte attivo',
    labelEn: 'Active front',
  },
  {
    id: 'burned_area',
    geometry: 'polygon',
    color: '#6B2D2D',
    labelIt: 'Area bruciata',
    labelEn: 'Burned area',
  },
  {
    id: 'water_point',
    geometry: 'point',
    color: '#1D6FBF',
    labelIt: 'Punto acqua',
    labelEn: 'Water point',
  },
  {
    id: 'lookout',
    geometry: 'point',
    color: '#2A9D8F',
    labelIt: 'Osservatorio',
    labelEn: 'Lookout',
  },
  {
    id: 'command_post',
    geometry: 'point',
    color: '#264653',
    labelIt: 'PC / ROS',
    labelEn: 'Command post',
  },
  {
    id: 'vehicle',
    geometry: 'point',
    color: '#457B9D',
    labelIt: 'Mezzo',
    labelEn: 'Vehicle',
  },
  {
    id: 'squad',
    geometry: 'point',
    color: '#2B9348',
    labelIt: 'Squadra',
    labelEn: 'Squad',
  },
  {
    id: 'road_closed',
    geometry: 'line',
    color: '#9B2226',
    labelIt: 'Strada chiusa',
    labelEn: 'Road closed',
  },
  {
    id: 'wind',
    geometry: 'arrow',
    color: '#4A5568',
    labelIt: 'Vento',
    labelEn: 'Wind',
  },
  {
    id: 'note',
    geometry: 'text',
    color: '#E5E5E5',
    labelIt: 'Nota',
    labelEn: 'Note',
  },
] as const

const SYMBOL_BY_ID = new Map(SYMBOL_CATALOG.map(s => [s.id, s]))

export function getSymbol(id: string): SymbolDef | undefined {
  return SYMBOL_BY_ID.get(id as SymbolId)
}
