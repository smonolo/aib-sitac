import { DEFAULT_CENTER } from '@aib-sitac/core'
import {
  normalizePassphraseHeader,
  PASSPHRASE_MAX_LENGTH,
  hashPassphrase,
  verifyPassphrase,
} from '../src/common/security'
import { incidentAccessChangedBus } from '../src/events/bus'
import { incidentFromRow } from '../src/incidents/incident-dto'
import type { IncidentRow } from '../src/db/index'

function sampleRow(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Bosco',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    createdBy: 'Sala',
    centerLng: 10.5,
    centerLat: 45.1,
    zoom: 14,
    passphraseHash: null,
    schemaVersion: 1,
    ...overrides,
  }
}

describe('normalizePassphraseHeader', () => {
  test('returns undefined for missing or empty values', () => {
    expect(normalizePassphraseHeader(undefined)).toBe(undefined)
    expect(normalizePassphraseHeader('')).toBe(undefined)
    expect(normalizePassphraseHeader([])).toBe(undefined)
    expect(normalizePassphraseHeader([''])).toBe(undefined)
  })

  test('accepts a single header string', () => {
    expect(normalizePassphraseHeader('segreto')).toBe('segreto')
  })

  test('uses the first value when the header is repeated', () => {
    expect(normalizePassphraseHeader(['first', 'second'])).toBe('first')
  })

  test('does not keep oversized header values', () => {
    const huge = 'y'.repeat(PASSPHRASE_MAX_LENGTH + 500)
    expect(normalizePassphraseHeader(huge)).toHaveLength(
      PASSPHRASE_MAX_LENGTH + 1
    )
  })
})

describe('verifyPassphrase length guard', () => {
  test('rejects oversized passphrases without matching', async () => {
    const hash = await hashPassphrase('ok-pass')
    const oversized = 'x'.repeat(PASSPHRASE_MAX_LENGTH + 1)
    expect(await verifyPassphrase(oversized, hash)).toBe(false)
    expect(await verifyPassphrase('', hash)).toBe(false)
  })
})

describe('incidentAccessChangedBus', () => {
  test('notifies subscribers for a room id', () => {
    const seen: string[] = []
    const sub = incidentAccessChangedBus.subscribe(msg => {
      seen.push(msg.incidentId)
    })
    incidentAccessChangedBus.next({ incidentId: 'room-a' })
    incidentAccessChangedBus.next({ incidentId: 'room-b' })
    sub.unsubscribe()
    expect(seen).toEqual(['room-a', 'room-b'])
  })
})

describe('incidentFromRow', () => {
  test('keeps map view for open rooms even when list-redacting', () => {
    const dto = incidentFromRow(sampleRow(), { redactMapView: true })
    expect(dto.centerLng).toBe(10.5)
    expect(dto.centerLat).toBe(45.1)
    expect(dto.zoom).toBe(14)
    expect(dto.hasPassphrase).toBe(false)
  })

  test('redacts map view for protected rooms on the public list', () => {
    const dto = incidentFromRow(sampleRow({ passphraseHash: 'scrypt$ab$cd' }), {
      redactMapView: true,
    })
    expect(dto.hasPassphrase).toBe(true)
    expect(dto.centerLng).toBe(DEFAULT_CENTER.lng)
    expect(dto.centerLat).toBe(DEFAULT_CENTER.lat)
    expect(dto.zoom).toBe(DEFAULT_CENTER.zoom)
    expect(dto.title).toBe('Bosco')
  })

  test('returns real map view after authorized access', () => {
    const dto = incidentFromRow(sampleRow({ passphraseHash: 'scrypt$ab$cd' }))
    expect(dto.centerLng).toBe(10.5)
    expect(dto.centerLat).toBe(45.1)
    expect(dto.zoom).toBe(14)
  })
})
