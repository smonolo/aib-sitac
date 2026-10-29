import { DEFAULT_CENTER, EVENT_OPS, ROME_TZ } from './types'

describe('product constants', () => {
  test('DEFAULT_CENTER is northern Italy-ish', () => {
    expect(DEFAULT_CENTER.lng > 8 && DEFAULT_CENTER.lng < 13).toBeTruthy()
    expect(DEFAULT_CENTER.lat > 44 && DEFAULT_CENTER.lat < 47).toBeTruthy()
    expect(DEFAULT_CENTER.zoom >= 8 && DEFAULT_CENTER.zoom <= 16).toBeTruthy()
  })

  test('ROME_TZ is Europe/Rome', () => {
    expect(ROME_TZ).toBe('Europe/Rome')
  })

  test('EVENT_OPS includes mark ops and legacy ops', () => {
    expect(EVENT_OPS.includes('upsert_feature')).toBeTruthy()
    expect(EVENT_OPS.includes('delete_feature')).toBeTruthy()
    expect(EVENT_OPS.includes('named_snapshot')).toBeTruthy()
    expect(EVENT_OPS.includes('set_view')).toBeTruthy()
    expect(EVENT_OPS.length).toBe(4)
  })
})
