import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
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
    assert.equal(features.length, 1)
    assert.equal(features[0]?.id, 'f2')
  })

  test('respects untilTs', () => {
    const atSnap = foldFeatures(base, '2026-10-26T10:05:00.000Z')
    assert.equal(atSnap.length, 1)
    assert.equal(atSnap[0]?.id, 'f1')
  })

  test('empty events yields empty features', () => {
    assert.deepEqual(foldFeatures([]), [])
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
    assert.deepEqual(foldFeatures(events), [])
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
    assert.equal(features.length, 1)
    assert.equal(features[0]?.properties.symbolId, 'lookout')
    assert.equal(features[0]?.properties.label, 'Updated')
    assert.deepEqual(features[0]?.geometry, {
      type: 'Point',
      coordinates: [9.3, 45.6],
    })
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
    assert.deepEqual(foldFeatures(events), [])
  })
})

describe('listNamedMoments', () => {
  test('extracts named snapshots', () => {
    const moments = listNamedMoments(base)
    assert.equal(moments.length, 1)
    assert.equal(moments[0]?.name, 'Primo fronte')
    assert.equal(moments[0]?.eventId, 'e2')
  })

  test('empty when none', () => {
    assert.deepEqual(listNamedMoments([base[0]!]), [])
  })
})

describe('listMarkEvents', () => {
  test('is every add/remove, not named labels', () => {
    const marks = listMarkEvents(base)
    assert.equal(marks.length, 3)
    assert.deepEqual(
      marks.map(e => e.op),
      ['upsert_feature', 'upsert_feature', 'delete_feature']
    )
  })
})

describe('featuresToGeoJson', () => {
  test('wraps folded features', () => {
    const fc = featuresToGeoJson(foldFeatures(base, '2026-10-26T10:05:00.000Z'))
    assert.equal(fc.type, 'FeatureCollection')
    assert.equal(fc.features.length, 1)
    assert.equal(fc.features[0]?.properties?.id, 'f1')
    assert.equal(fc.features[0]?.properties?.symbolId, 'hotspot')
  })
})
