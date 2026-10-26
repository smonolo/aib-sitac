import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SYMBOL_CATALOG, SYMBOL_IDS, getSymbol } from './symbols'

test('catalog covers every symbol id', () => {
  assert.equal(SYMBOL_CATALOG.length, SYMBOL_IDS.length)
  for (const id of SYMBOL_IDS) {
    const def = getSymbol(id)
    assert.ok(def)
    assert.equal(def?.id, id)
    assert.ok(def?.labelIt)
    assert.ok(def?.labelEn)
    assert.ok(def?.color.startsWith('#'))
  }
})

test('getSymbol returns undefined for unknown id', () => {
  assert.equal(getSymbol('not-a-symbol'), undefined)
})
