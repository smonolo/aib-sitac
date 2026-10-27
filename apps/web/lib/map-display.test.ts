import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { SitacFeature } from '@aib-sitac/core'
import { draftToDisplayGeoJson, featuresToDisplayGeoJson } from './map-display'

const pointFeature: SitacFeature = {
  id: 'p1',
  geometry: { type: 'Point', coordinates: [9.2, 45.5] },
  properties: {
    symbolId: 'hotspot',
    geometryKind: 'point',
    color: '#AF2525',
  },
  updatedAt: '2026-10-26T10:00:00.000Z',
}

const arrowFeature: SitacFeature = {
  id: 'a1',
  geometry: {
    type: 'LineString',
    coordinates: [
      [9.2, 45.5],
      [9.21, 45.51],
      [9.22, 45.52],
    ],
  },
  properties: {
    symbolId: 'active_front',
    geometryKind: 'arrow',
    color: '#E85D04',
  },
  updatedAt: '2026-10-26T10:00:00.000Z',
}

const lineFeature: SitacFeature = {
  id: 'l1',
  geometry: {
    type: 'LineString',
    coordinates: [
      [9.2, 45.5],
      [9.21, 45.51],
    ],
  },
  properties: {
    symbolId: 'road_closed',
    geometryKind: 'line',
    color: '#9B2226',
  },
  updatedAt: '2026-10-26T10:00:00.000Z',
}

const polygonFeature: SitacFeature = {
  id: 'poly1',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [9.2, 45.5],
        [9.21, 45.5],
        [9.21, 45.51],
        [9.2, 45.5],
      ],
    ],
  },
  properties: {
    symbolId: 'burned_area',
    geometryKind: 'polygon',
    color: '#6B2D2D',
  },
  updatedAt: '2026-10-26T10:00:00.000Z',
}

describe('featuresToDisplayGeoJson', () => {
  test('point stays a single feature without mark icon', () => {
    const fc = featuresToDisplayGeoJson([pointFeature])
    assert.equal(fc.features.length, 1)
    assert.equal(fc.features[0]?.properties?.isMarkIcon, false)
    assert.equal(fc.features[0]?.properties?.isArrowHead, false)
  })

  test('line adds midpoint mark icon', () => {
    const fc = featuresToDisplayGeoJson([lineFeature])
    assert.equal(fc.features.length, 2)
    const icon = fc.features.find(f => f.properties?.isMarkIcon)
    assert.ok(icon)
    assert.equal(icon?.geometry.type, 'Point')
    assert.equal(icon?.properties?.symbolId, 'road_closed')
    assert.equal(
      fc.features.some(f => f.properties?.isArrowHead),
      false
    )
  })

  test('arrow adds mark icon and arrow head with bearing', () => {
    const fc = featuresToDisplayGeoJson([arrowFeature])
    assert.equal(fc.features.length, 3)
    const head = fc.features.find(f => f.properties?.isArrowHead)
    assert.ok(head)
    assert.equal(head?.geometry.type, 'Point')
    assert.deepEqual(
      (head?.geometry as GeoJSON.Point).coordinates,
      [9.22, 45.52]
    )
    assert.equal(typeof head?.properties?.bearing, 'number')
    assert.equal(head?.properties?.id, 'a1')
  })

  test('polygon adds centroid mark icon', () => {
    const fc = featuresToDisplayGeoJson([polygonFeature])
    assert.equal(fc.features.length, 2)
    const icon = fc.features.find(f => f.properties?.isMarkIcon)
    assert.ok(icon)
    assert.equal(icon?.geometry.type, 'Point')
    assert.equal(icon?.properties?.symbolId, 'burned_area')
  })

  test('empty input', () => {
    const fc = featuresToDisplayGeoJson([])
    assert.equal(fc.type, 'FeatureCollection')
    assert.equal(fc.features.length, 0)
  })
})

describe('draftToDisplayGeoJson', () => {
  test('empty or null kind yields no features', () => {
    assert.equal(draftToDisplayGeoJson([], 'line').features.length, 0)
    assert.equal(draftToDisplayGeoJson([[9, 45]], null).features.length, 0)
  })

  test('single point draft', () => {
    const fc = draftToDisplayGeoJson([[9, 45]], 'line', '#111')
    assert.equal(fc.features.length, 1)
    assert.equal(fc.features[0]?.geometry.type, 'Point')
    assert.equal(fc.features[0]?.properties?.color, '#111')
  })

  test('line draft includes vertex points', () => {
    const coords: [number, number][] = [
      [9, 45],
      [9.1, 45.1],
    ]
    const fc = draftToDisplayGeoJson(coords, 'line')
    assert.ok(fc.features.some(f => f.geometry.type === 'LineString'))
    assert.equal(
      fc.features.filter(
        f => f.geometry.type === 'Point' && !f.properties?.isArrowHead
      ).length,
      2
    )
  })

  test('arrow draft includes arrow head', () => {
    const fc = draftToDisplayGeoJson(
      [
        [9, 45],
        [9.1, 45.1],
      ],
      'arrow',
      '#E85D04'
    )
    const head = fc.features.find(f => f.properties?.isArrowHead)
    assert.ok(head)
    assert.equal(head?.properties?.color, '#E85D04')
    assert.equal(typeof head?.properties?.bearing, 'number')
  })

  test('polygon draft closes the ring when enough vertices', () => {
    const fc = draftToDisplayGeoJson(
      [
        [9, 45],
        [9.1, 45],
        [9.1, 45.1],
      ],
      'polygon'
    )
    const poly = fc.features.find(f => f.geometry.type === 'Polygon')
    assert.ok(poly)
    const ring = (poly?.geometry as GeoJSON.Polygon).coordinates[0]!
    assert.deepEqual(ring[0], ring[ring.length - 1])
  })

  test('polygon draft with two points has no polygon geometry yet', () => {
    const fc = draftToDisplayGeoJson(
      [
        [9, 45],
        [9.1, 45],
      ],
      'polygon'
    )
    assert.equal(
      fc.features.some(f => f.geometry.type === 'Polygon'),
      false
    )
  })
})
