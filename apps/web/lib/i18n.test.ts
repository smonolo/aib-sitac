import { SYMBOL_IDS } from '@aib-sitac/core'
import {
  copy,
  drawHintForGeometry,
  formatPageOf,
  formatStepOf,
  geometryKindLabel,
  t,
} from './i18n'

describe('copy catalog', () => {
  test('t returns Italian catalog', () => {
    expect(t().brand).toBe('AIB SITAC')
    expect(t().tagline).toBe(copy.tagline)
  })

  test('required operator strings exist', () => {
    const c = t()
    expect(c.createCta).toBeTruthy()
    expect(c.palette).toBeTruthy()
    expect(c.timeline).toBeTruthy()
    expect(c.moveFeature).toBeTruthy()
    expect(c.editTextFeature).toBeTruthy()
    expect(c.finishMove).toBeTruthy()
    expect(c.moveHint).toBeTruthy()
    expect(c.textDialogSave).toBeTruthy()
    expect(c.selectedMarkHow).toMatch(/Modifica/)
    expect(c.unofficial).toMatch(/non ufficiale/i)
    expect(c.unofficial).toMatch(/Protezione Civile/)
  })

  test('symbolPurpose covers every catalog symbol', () => {
    for (const id of SYMBOL_IDS) {
      expect(copy.symbolPurpose[id]).toBeTruthy()
      expect(copy.symbolPurpose[id].length > 10).toBeTruthy()
    }
  })
})

describe('geometryKindLabel', () => {
  test('maps kinds to Italian labels', () => {
    expect(geometryKindLabel('point')).toBe(copy.geomPoint)
    expect(geometryKindLabel('line')).toBe(copy.geomLine)
    expect(geometryKindLabel('arrow')).toBe(copy.geomArrow)
    expect(geometryKindLabel('polygon')).toBe(copy.geomArea)
    expect(geometryKindLabel('text')).toBe(copy.geomText)
  })
})

describe('drawHintForGeometry', () => {
  test('returns a non-empty hint per geometry', () => {
    for (const kind of ['point', 'line', 'arrow', 'polygon', 'text'] as const) {
      const hint = drawHintForGeometry(kind)
      expect(hint.length > 5).toBeTruthy()
    }
  })
})

describe('format helpers', () => {
  test('formatStepOf', () => {
    expect(formatStepOf(2, 5)).toBe('2/5')
  })

  test('formatPageOf', () => {
    expect(formatPageOf(1, 3)).toBe('Pagina 1 / 3')
  })
})
