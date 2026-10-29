import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
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
    assert.equal(normalizePassphraseHeader(undefined), undefined)
    assert.equal(normalizePassphraseHeader(''), undefined)
    assert.equal(normalizePassphraseHeader([]), undefined)
    assert.equal(normalizePassphraseHeader(['']), undefined)
  })

  test('accepts a single header string', () => {
    assert.equal(normalizePassphraseHeader('segreto'), 'segreto')
  })

  test('uses the first value when the header is repeated', () => {
    assert.equal(normalizePassphraseHeader(['first', 'second']), 'first')
  })

  test('does not keep oversized header values', () => {
    const huge = 'y'.repeat(PASSPHRASE_MAX_LENGTH + 500)
    const normalized = normalizePassphraseHeader(huge)
    assert.ok(normalized)
    assert.equal(normalized.length, PASSPHRASE_MAX_LENGTH + 1)
  })
})

describe('verifyPassphrase length guard', () => {
  test('rejects oversized passphrases without matching', async () => {
    const hash = await hashPassphrase('ok-pass')
    const oversized = 'x'.repeat(PASSPHRASE_MAX_LENGTH + 1)
    assert.equal(await verifyPassphrase(oversized, hash), false)
    assert.equal(await verifyPassphrase('', hash), false)
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
    assert.deepEqual(seen, ['room-a', 'room-b'])
  })
})

describe('incidentFromRow', () => {
  test('keeps map view for open rooms even when list-redacting', () => {
    const dto = incidentFromRow(sampleRow(), { redactMapView: true })
    assert.equal(dto.centerLng, 10.5)
    assert.equal(dto.centerLat, 45.1)
    assert.equal(dto.zoom, 14)
    assert.equal(dto.hasPassphrase, false)
  })

  test('redacts map view for protected rooms on the public list', () => {
    const dto = incidentFromRow(sampleRow({ passphraseHash: 'scrypt$ab$cd' }), {
      redactMapView: true,
    })
    assert.equal(dto.hasPassphrase, true)
    assert.equal(dto.centerLng, DEFAULT_CENTER.lng)
    assert.equal(dto.centerLat, DEFAULT_CENTER.lat)
    assert.equal(dto.zoom, DEFAULT_CENTER.zoom)
    assert.equal(dto.title, 'Bosco')
  })

  test('returns real map view after authorized access', () => {
    const dto = incidentFromRow(sampleRow({ passphraseHash: 'scrypt$ab$cd' }))
    assert.equal(dto.centerLng, 10.5)
    assert.equal(dto.centerLat, 45.1)
    assert.equal(dto.zoom, 14)
  })
})
