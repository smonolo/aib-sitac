import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
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
    assert.equal(t().brand, 'AIB SITAC')
    assert.equal(t().tagline, copy.tagline)
  })

  test('required operator strings exist', () => {
    const c = t()
    assert.ok(c.createCta)
    assert.ok(c.palette)
    assert.ok(c.timeline)
    assert.match(c.unofficial, /non ufficiale/i)
    assert.match(c.unofficial, /Protezione Civile/)
  })

  test('symbolHelp covers every catalog symbol', () => {
    for (const id of SYMBOL_IDS) {
      assert.ok(copy.symbolHelp[id], `missing symbolHelp for ${id}`)
      assert.ok(copy.symbolHelp[id].length > 10)
    }
  })
})

describe('geometryKindLabel', () => {
  test('maps kinds to Italian labels', () => {
    assert.equal(geometryKindLabel('point'), copy.geomPoint)
    assert.equal(geometryKindLabel('line'), copy.geomLine)
    assert.equal(geometryKindLabel('arrow'), copy.geomArrow)
    assert.equal(geometryKindLabel('polygon'), copy.geomArea)
    assert.equal(geometryKindLabel('text'), copy.geomText)
  })
})

describe('drawHintForGeometry', () => {
  test('returns a non-empty hint per geometry', () => {
    for (const kind of ['point', 'line', 'arrow', 'polygon', 'text'] as const) {
      const hint = drawHintForGeometry(kind)
      assert.ok(hint.length > 5)
    }
  })
})

describe('format helpers', () => {
  test('formatStepOf', () => {
    assert.equal(formatStepOf(2, 5), 'Step 2 / 5')
  })

  test('formatPageOf', () => {
    assert.equal(formatPageOf(1, 3), 'Pagina 1 / 3')
  })
})
