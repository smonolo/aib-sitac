import {
  ANNOTATION_SYMBOL_IDS,
  SYMBOL_CATALOG,
  SYMBOL_IDS,
  getSymbol,
  isAnnotationSymbol,
} from './symbols'

describe('SYMBOL_CATALOG', () => {
  test('covers every symbol id', () => {
    expect(SYMBOL_CATALOG.length).toBe(SYMBOL_IDS.length)
    for (const id of SYMBOL_IDS) {
      const def = getSymbol(id)
      expect(def).toBeTruthy()
      expect(def?.id).toBe(id)
      expect(def?.label).toBeTruthy()
      expect(def?.color.startsWith('#')).toBeTruthy()
      expect(
        ['point', 'line', 'arrow', 'polygon', 'text'].includes(def!.geometry)
      ).toBeTruthy()
    }
  })

  test('annotation tools are first three entries', () => {
    expect(SYMBOL_CATALOG.slice(0, 3).map(s => s.id)).toEqual([
      ...ANNOTATION_SYMBOL_IDS,
    ])
  })
})

describe('getSymbol', () => {
  test('returns undefined for unknown id', () => {
    expect(getSymbol('not-a-symbol')).toBe(undefined)
  })
})

describe('isAnnotationSymbol', () => {
  test('true for freccia / forma / testo', () => {
    expect(isAnnotationSymbol('arrow')).toBe(true)
    expect(isAnnotationSymbol('shape')).toBe(true)
    expect(isAnnotationSymbol('note')).toBe(true)
  })

  test('false for tactical marks', () => {
    expect(isAnnotationSymbol('hotspot')).toBe(false)
    expect(isAnnotationSymbol('wind')).toBe(false)
    expect(isAnnotationSymbol('unknown')).toBe(false)
  })
})
