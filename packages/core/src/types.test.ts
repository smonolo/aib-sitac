import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { DEFAULT_CENTER, EVENT_OPS, ROME_TZ } from './types'

describe('product constants', () => {
  test('DEFAULT_CENTER is northern Italy-ish', () => {
    assert.ok(DEFAULT_CENTER.lng > 8 && DEFAULT_CENTER.lng < 13)
    assert.ok(DEFAULT_CENTER.lat > 44 && DEFAULT_CENTER.lat < 47)
    assert.ok(DEFAULT_CENTER.zoom >= 8 && DEFAULT_CENTER.zoom <= 16)
  })

  test('ROME_TZ is Europe/Rome', () => {
    assert.equal(ROME_TZ, 'Europe/Rome')
  })

  test('EVENT_OPS includes mark ops and legacy ops', () => {
    assert.ok(EVENT_OPS.includes('upsert_feature'))
    assert.ok(EVENT_OPS.includes('delete_feature'))
    assert.ok(EVENT_OPS.includes('named_snapshot'))
    assert.ok(EVENT_OPS.includes('set_view'))
    assert.equal(EVENT_OPS.length, 4)
  })
})
