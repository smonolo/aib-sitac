export const SYMBOL_IDS = [
  'arrow',
  'shape',
  'note',
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
] as const

export type SymbolId = (typeof SYMBOL_IDS)[number]

export type GeometryKind = 'point' | 'line' | 'arrow' | 'polygon' | 'text'

export type SymbolDef = {
  id: SymbolId
  geometry: GeometryKind
  color: string
  label: string
}

export const ANNOTATION_SYMBOL_IDS = ['arrow', 'shape', 'note'] as const

export const SYMBOL_CATALOG: readonly SymbolDef[] = [
  {
    id: 'arrow',
    geometry: 'arrow',
    color: '#171717',
    label: 'Freccia',
  },
  {
    id: 'shape',
    geometry: 'polygon',
    color: '#171717',
    label: 'Forma',
  },
  {
    id: 'note',
    geometry: 'text',
    color: '#171717',
    label: 'Testo',
  },
  {
    id: 'hotspot',
    geometry: 'point',
    color: '#AF2525',
    label: 'Hotspot',
  },
  {
    id: 'active_front',
    geometry: 'arrow',
    color: '#E85D04',
    label: 'Fronte attivo',
  },
  {
    id: 'burned_area',
    geometry: 'polygon',
    color: '#6B2D2D',
    label: 'Area bruciata',
  },
  {
    id: 'water_point',
    geometry: 'point',
    color: '#1D6FBF',
    label: 'Punto acqua',
  },
  {
    id: 'lookout',
    geometry: 'point',
    color: '#2A9D8F',
    label: 'Osservatorio',
  },
  {
    id: 'command_post',
    geometry: 'point',
    color: '#264653',
    label: 'Posto di comando',
  },
  {
    id: 'vehicle',
    geometry: 'point',
    color: '#457B9D',
    label: 'Mezzo',
  },
  {
    id: 'squad',
    geometry: 'point',
    color: '#2B9348',
    label: 'Squadra',
  },
  {
    id: 'road_closed',
    geometry: 'line',
    color: '#9B2226',
    label: 'Strada chiusa',
  },
  {
    id: 'wind',
    geometry: 'arrow',
    color: '#4A5568',
    label: 'Vento',
  },
] as const

const SYMBOL_BY_ID = new Map(SYMBOL_CATALOG.map(s => [s.id, s]))

export function getSymbol(id: string): SymbolDef | undefined {
  return SYMBOL_BY_ID.get(id as SymbolId)
}

export function isAnnotationSymbol(id: string): boolean {
  return (ANNOTATION_SYMBOL_IDS as readonly string[]).includes(id)
}
