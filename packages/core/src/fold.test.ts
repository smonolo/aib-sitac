import {
  featuresToGeoJson,
  foldFeatures,
  listMarkEvents,
  listNamedMoments,
} from './fold'
import type { SitacEvent } from './types'

const base: SitacEvent[] = [
  {
    id: 'e1',
    incidentId: 'i1',
    ts: '2026-10-26T10:00:00.000Z',
    actorLabel: 'Sala',
    op: 'upsert_feature',
    payload: {
      featureId: 'f1',
      geometry: { type: 'Point', coordinates: [9.2, 45.5] },
      properties: {
        symbolId: 'hotspot',
        geometryKind: 'point',
      },
    },
  },
  {
    id: 'e2',
    incidentId: 'i1',
    ts: '2026-10-26T10:05:00.000Z',
    actorLabel: null,
    op: 'named_snapshot',
    payload: { name: 'Primo fronte' },
  },
  {
    id: 'e3',
    incidentId: 'i1',
    ts: '2026-10-26T10:10:00.000Z',
    actorLabel: null,
    op: 'upsert_feature',
    payload: {
      featureId: 'f2',
      geometry: {
        type: 'LineString',
        coordinates: [
          [9.2, 45.5],
          [9.21, 45.51],
        ],
      },
      properties: {
        symbolId: 'active_front',
        geometryKind: 'arrow',
      },
    },
  },
  {
    id: 'e4',
    incidentId: 'i1',
    ts: '2026-10-26T10:15:00.000Z',
    actorLabel: null,
    op: 'delete_feature',
    payload: { featureId: 'f1' },
  },
]

describe('foldFeatures', () => {
  test('returns all live features', () => {
    const features = foldFeatures(base)
    expect(features.length).toBe(1)
    expect(features[0]?.id).toBe('f2')
  })

  test('respects untilTs', () => {
    const atSnap = foldFeatures(base, '2026-10-26T10:05:00.000Z')
    expect(atSnap.length).toBe(1)
    expect(atSnap[0]?.id).toBe('f1')
  })

  test('empty events yields empty features', () => {
    expect(foldFeatures([])).toEqual([])
  })

  test('ignores set_view and named_snapshot for map state', () => {
    const events: SitacEvent[] = [
      {
        id: 'v1',
        incidentId: 'i1',
        ts: '2026-10-26T09:00:00.000Z',
        actorLabel: null,
        op: 'set_view',
        payload: { center: [9, 45], zoom: 12 },
      },
      {
        id: 'n1',
        incidentId: 'i1',
        ts: '2026-10-26T09:30:00.000Z',
        actorLabel: null,
        op: 'named_snapshot',
        payload: { name: 'Label only' },
      },
    ]
    expect(foldFeatures(events)).toEqual([])
  })

  test('later upsert replaces earlier feature', () => {
    const events: SitacEvent[] = [
      base[0]!,
      {
        id: 'e1b',
        incidentId: 'i1',
        ts: '2026-10-26T10:02:00.000Z',
        actorLabel: null,
        op: 'upsert_feature',
        payload: {
          featureId: 'f1',
          geometry: { type: 'Point', coordinates: [9.3, 45.6] },
          properties: {
            symbolId: 'lookout',
            geometryKind: 'point',
            label: 'Updated',
          },
        },
      },
    ]
    const features = foldFeatures(events)
    expect(features.length).toBe(1)
    expect(features[0]?.properties.symbolId).toBe('lookout')
    expect(features[0]?.properties.label).toBe('Updated')
    expect(features[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [9.3, 45.6],
    })
  })

  test('text mark edit keeps geometry and updates label/note', () => {
    const events: SitacEvent[] = [
      {
        id: 'n1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9.1, 45.2] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'Vecchio',
            note: 'Vecchio',
            color: '#111111',
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
          geometry: { type: 'Point', coordinates: [9.1, 45.2] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'Nuovo',
            note: 'Nuovo',
            color: '#111111',
          },
        },
      },
    ]
    const live = foldFeatures(events)
    expect(live).toHaveLength(1)
    expect(live[0]?.properties.label).toBe('Nuovo')
    expect(live[0]?.properties.note).toBe('Nuovo')
    expect(live[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [9.1, 45.2],
    })
    const beforeEdit = foldFeatures(events, '2026-10-26T10:00:00.000Z')
    expect(beforeEdit[0]?.properties.label).toBe('Vecchio')
  })

  test('text mark move then edit folds to latest geometry and label', () => {
    const events: SitacEvent[] = [
      {
        id: 'n1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9.0, 45.0] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'A',
            note: 'A',
          },
        },
      },
      {
        id: 'n2',
        incidentId: 'i1',
        ts: '2026-10-26T10:01:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9.5, 45.5] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'A',
            note: 'A',
          },
        },
      },
      {
        id: 'n3',
        incidentId: 'i1',
        ts: '2026-10-26T10:02:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9.5, 45.5] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'B',
            note: 'B',
          },
        },
      },
    ]
    const live = foldFeatures(events)
    expect(live).toHaveLength(1)
    expect(live[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [9.5, 45.5],
    })
    expect(live[0]?.properties.label).toBe('B')
    expect(
      foldFeatures(events, '2026-10-26T10:01:00.000Z')[0]?.properties.label
    ).toBe('A')
  })

  test('delete after text edit removes the feature', () => {
    const events: SitacEvent[] = [
      {
        id: 'n1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: 'Sala',
        op: 'upsert_feature',
        payload: {
          featureId: 'note-1',
          geometry: { type: 'Point', coordinates: [9.1, 45.2] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'Gone',
            note: 'Gone',
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
          geometry: { type: 'Point', coordinates: [9.1, 45.2] },
          properties: {
            symbolId: 'note',
            geometryKind: 'text',
            label: 'Edited',
            note: 'Edited',
          },
        },
      },
      {
        id: 'n3',
        incidentId: 'i1',
        ts: '2026-10-26T10:10:00.000Z',
        actorLabel: 'Sala',
        op: 'delete_feature',
        payload: { featureId: 'note-1' },
      },
    ]
    expect(foldFeatures(events)).toEqual([])
    expect(foldFeatures(events, '2026-10-26T10:05:00.000Z')).toHaveLength(1)
    expect(listMarkEvents(events)).toHaveLength(3)
  })

  test('delete of unknown feature is a no-op', () => {
    const events: SitacEvent[] = [
      {
        id: 'd1',
        incidentId: 'i1',
        ts: '2026-10-26T10:00:00.000Z',
        actorLabel: null,
        op: 'delete_feature',
        payload: { featureId: 'missing' },
      },
    ]
    expect(foldFeatures(events)).toEqual([])
  })
})

describe('listNamedMoments', () => {
  test('extracts named snapshots', () => {
    const moments = listNamedMoments(base)
    expect(moments.length).toBe(1)
    expect(moments[0]?.name).toBe('Primo fronte')
    expect(moments[0]?.eventId).toBe('e2')
  })

  test('empty when none', () => {
    expect(listNamedMoments([base[0]!])).toEqual([])
  })
})

describe('listMarkEvents', () => {
  test('is every add/remove, not named labels', () => {
    const marks = listMarkEvents(base)
    expect(marks.length).toBe(3)
    expect(marks.map(e => e.op)).toEqual([
      'upsert_feature',
      'upsert_feature',
      'delete_feature',
    ])
  })
})

describe('featuresToGeoJson', () => {
  test('wraps folded features', () => {
    const fc = featuresToGeoJson(foldFeatures(base, '2026-10-26T10:05:00.000Z'))
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBe(1)
    expect(fc.features[0]?.properties?.id).toBe('f1')
    expect(fc.features[0]?.properties?.symbolId).toBe('hotspot')
  })
})
