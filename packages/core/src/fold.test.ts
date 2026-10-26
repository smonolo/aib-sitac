import assert from 'node:assert/strict'
import { test } from 'node:test'
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

test('foldFeatures returns all live features', () => {
  const features = foldFeatures(base)
  assert.equal(features.length, 1)
  assert.equal(features[0]?.id, 'f2')
})

test('foldFeatures respects untilTs', () => {
  const atSnap = foldFeatures(base, '2026-10-26T10:05:00.000Z')
  assert.equal(atSnap.length, 1)
  assert.equal(atSnap[0]?.id, 'f1')
})

test('listNamedMoments', () => {
  const moments = listNamedMoments(base)
  assert.equal(moments.length, 1)
  assert.equal(moments[0]?.name, 'Primo fronte')
})

test('listMarkEvents is every add/remove, not named labels', () => {
  const marks = listMarkEvents(base)
  assert.equal(marks.length, 3)
  assert.deepEqual(
    marks.map(e => e.op),
    ['upsert_feature', 'upsert_feature', 'delete_feature']
  )
})

test('featuresToGeoJson', () => {
  const fc = featuresToGeoJson(foldFeatures(base, '2026-10-26T10:05:00.000Z'))
  assert.equal(fc.type, 'FeatureCollection')
  assert.equal(fc.features.length, 1)
})
