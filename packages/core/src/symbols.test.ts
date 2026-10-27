import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  ANNOTATION_SYMBOL_IDS,
  SYMBOL_CATALOG,
  SYMBOL_IDS,
  getSymbol,
  isAnnotationSymbol,
} from './symbols'

describe('SYMBOL_CATALOG', () => {
  test('covers every symbol id', () => {
    assert.equal(SYMBOL_CATALOG.length, SYMBOL_IDS.length)
    for (const id of SYMBOL_IDS) {
      const def = getSymbol(id)
      assert.ok(def)
      assert.equal(def?.id, id)
      assert.ok(def?.label)
      assert.ok(def?.color.startsWith('#'))
      assert.ok(
        ['point', 'line', 'arrow', 'polygon', 'text'].includes(def!.geometry)
      )
    }
  })

  test('annotation tools are first three entries', () => {
    assert.deepEqual(
      SYMBOL_CATALOG.slice(0, 3).map(s => s.id),
      [...ANNOTATION_SYMBOL_IDS]
    )
  })
})

describe('getSymbol', () => {
  test('returns undefined for unknown id', () => {
    assert.equal(getSymbol('not-a-symbol'), undefined)
  })
})

describe('isAnnotationSymbol', () => {
  test('true for freccia / forma / testo', () => {
    assert.equal(isAnnotationSymbol('arrow'), true)
    assert.equal(isAnnotationSymbol('shape'), true)
    assert.equal(isAnnotationSymbol('note'), true)
  })

  test('false for tactical marks', () => {
    assert.equal(isAnnotationSymbol('hotspot'), false)
    assert.equal(isAnnotationSymbol('wind'), false)
    assert.equal(isAnnotationSymbol('unknown'), false)
  })
})
