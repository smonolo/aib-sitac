import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { summarizeMarkEvents } from './mark-event'
import type { SitacEvent } from './types'

const events: SitacEvent[] = [
  {
    id: 'e1',
    incidentId: 'i1',
    ts: '2026-10-26T10:00:00.000Z',
    actorLabel: 'Sala',
    op: 'upsert_feature',
    payload: {
      featureId: 'f1',
      geometry: { type: 'Point', coordinates: [9, 45] },
      properties: { symbolId: 'wind', geometryKind: 'arrow', color: '#4A5568' },
    },
  },
  {
    id: 'e2',
    incidentId: 'i1',
    ts: '2026-10-26T10:05:00.000Z',
    actorLabel: 'Caposquadra',
    op: 'delete_feature',
    payload: { featureId: 'f1' },
  },
]

describe('summarizeMarkEvents', () => {
  test('resolves add and remove labels from catalog', () => {
    const [add, remove] = summarizeMarkEvents(events)
    assert.equal(add?.action, 'add')
    assert.equal(add?.symbolId, 'wind')
    assert.equal(add?.label, 'Vento')
    assert.equal(add?.color, '#4A5568')
    assert.equal(add?.actorLabel, 'Sala')
    assert.equal(remove?.action, 'remove')
    assert.equal(remove?.symbolId, 'wind')
    assert.equal(remove?.label, 'Vento')
    assert.equal(remove?.actorLabel, 'Caposquadra')
  })

  test('prefers feature text label over catalog for notes', () => {
    const noteEvents: SitacEvent[] = [
      {
        id: 'n1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9, 45] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: '  Punto di raccolta  ',
          },
        },
      },
    ]
    const [summary] = summarizeMarkEvents(noteEvents)
    assert.equal(summary?.label, 'Punto di raccolta')
    assert.equal(summary?.geometryKind, 'text')
  })

  test('delete without prior upsert uses fallback label', () => {
    const orphanDelete: SitacEvent[] = [
      {
        id: 'd1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: null,
        op: 'delete_feature',
        payload: { featureId: 'ghost' },
      },
    ]
    const [summary] = summarizeMarkEvents(orphanDelete, 'Segno')
    assert.equal(summary?.action, 'remove')
    assert.equal(summary?.symbolId, null)
    assert.equal(summary?.label, 'Segno')
    assert.equal(summary?.actorLabel, null)
  })

  test('skips non-mark ops', () => {
    const mixed: SitacEvent[] = [
      {
        id: 's1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: null,
        op: 'named_snapshot',
        payload: { name: 'Momento' },
      },
      events[0]!,
    ]
    const summaries = summarizeMarkEvents(mixed)
    assert.equal(summaries.length, 1)
    assert.equal(summaries[0]?.eventId, 'e1')
  })

  test('trims blank actor labels to null', () => {
    const withBlank: SitacEvent[] = [
      {
        ...events[0]!,
        actorLabel: '   ',
      },
    ]
    const [summary] = summarizeMarkEvents(withBlank)
    assert.equal(summary?.actorLabel, null)
  })
})
