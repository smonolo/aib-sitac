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
    expect(add?.action).toBe('add')
    expect(add?.symbolId).toBe('wind')
    expect(add?.label).toBe('Vento')
    expect(add?.color).toBe('#4A5568')
    expect(add?.actorLabel).toBe('Sala')
    expect(remove?.action).toBe('remove')
    expect(remove?.symbolId).toBe('wind')
    expect(remove?.label).toBe('Vento')
    expect(remove?.actorLabel).toBe('Caposquadra')
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
    expect(summary?.label).toBe('Punto di raccolta')
    expect(summary?.geometryKind).toBe('text')
  })

  test('text edit upsert is a second add step with the new label', () => {
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
            label: 'Prima',
            note: 'Prima',
          },
        },
      },
      {
        id: 'n2',
        incidentId: 'i1',
        ts: '2026-10-26T10:05:00.000Z',
        actorLabel: 'Caposquadra',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9, 45] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'Dopo',
            note: 'Dopo',
          },
        },
      },
    ]
    const summaries = summarizeMarkEvents(noteEvents)
    expect(summaries).toHaveLength(2)
    expect(summaries[0]?.action).toBe('add')
    expect(summaries[0]?.label).toBe('Prima')
    expect(summaries[0]?.actorLabel).toBe('Sala')
    expect(summaries[1]?.action).toBe('add')
    expect(summaries[1]?.label).toBe('Dopo')
    expect(summaries[1]?.actorLabel).toBe('Caposquadra')
    expect(summaries[1]?.featureId).toBe('note-1')
  })

  test('delete after text edit uses the latest label', () => {
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
            label: 'Prima',
          },
        },
      },
      {
        id: 'n2',
        incidentId: 'i1',
        ts: '2026-10-26T10:05:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9, 45] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'Ultima',
          },
        },
      },
      {
        id: 'n3',
        incidentId: 'i1',
        ts: '2026-10-26T10:10:00.000Z',
        actorLabel: 'Caposquadra',
        op: 'delete_feature',
        payload: { featureId: 'note-1' },
      },
    ]
    const summaries = summarizeMarkEvents(noteEvents)
    expect(summaries).toHaveLength(3)
    expect(summaries[2]?.action).toBe('remove')
    expect(summaries[2]?.label).toBe('Ultima')
    expect(summaries[2]?.symbolId).toBe('note')
    expect(summaries[2]?.geometryKind).toBe('text')
  })

  test('note without label falls back to catalog Testo', () => {
    const noteEvents: SitacEvent[] = [
      {
        id: 'n1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: null,
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9, 45] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
          },
        },
      },
    ]
    const [summary] = summarizeMarkEvents(noteEvents)
    expect(summary?.label).toBe('Testo')
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
    expect(summary?.action).toBe('remove')
    expect(summary?.symbolId).toBe(null)
    expect(summary?.label).toBe('Segno')
    expect(summary?.actorLabel).toBe(null)
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
    expect(summaries.length).toBe(1)
    expect(summaries[0]?.eventId).toBe('e1')
  })

  test('trims blank actor labels to null', () => {
    const withBlank: SitacEvent[] = [
      {
        ...events[0]!,
        actorLabel: '   ',
      },
    ]
    const [summary] = summarizeMarkEvents(withBlank)
    expect(summary?.actorLabel).toBe(null)
  })
})
