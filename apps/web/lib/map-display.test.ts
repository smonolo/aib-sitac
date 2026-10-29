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
    expect(fc.features.length).toBe(1)
    expect(fc.features[0]?.properties?.isMarkIcon).toBe(false)
    expect(fc.features[0]?.properties?.isArrowHead).toBe(false)
  })

  test('line adds midpoint mark icon', () => {
    const fc = featuresToDisplayGeoJson([lineFeature])
    expect(fc.features.length).toBe(2)
    const icon = fc.features.find(f => f.properties?.isMarkIcon)
    expect(icon).toBeTruthy()
    expect(icon?.geometry.type).toBe('Point')
    expect(icon?.properties?.symbolId).toBe('road_closed')
    expect(fc.features.some(f => f.properties?.isArrowHead)).toBe(false)
  })

  test('arrow adds mark icon and arrow head with bearing', () => {
    const fc = featuresToDisplayGeoJson([arrowFeature])
    expect(fc.features.length).toBe(3)
    const head = fc.features.find(f => f.properties?.isArrowHead)
    expect(head).toBeTruthy()
    expect(head?.geometry.type).toBe('Point')
    expect((head?.geometry as GeoJSON.Point).coordinates).toEqual([9.22, 45.52])
    expect(typeof head?.properties?.bearing).toBe('number')
    expect(head?.properties?.id).toBe('a1')
  })

  test('polygon adds centroid mark icon', () => {
    const fc = featuresToDisplayGeoJson([polygonFeature])
    expect(fc.features.length).toBe(2)
    const icon = fc.features.find(f => f.properties?.isMarkIcon)
    expect(icon).toBeTruthy()
    expect(icon?.geometry.type).toBe('Point')
    expect(icon?.properties?.symbolId).toBe('burned_area')
  })

  test('empty input', () => {
    const fc = featuresToDisplayGeoJson([])
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBe(0)
  })
})

describe('draftToDisplayGeoJson', () => {
  test('empty or null kind yields no features', () => {
    expect(draftToDisplayGeoJson([], 'line').features.length).toBe(0)
    expect(draftToDisplayGeoJson([[9, 45]], null).features.length).toBe(0)
  })

  test('single point draft', () => {
    const fc = draftToDisplayGeoJson([[9, 45]], 'line', '#111')
    expect(fc.features.length).toBe(1)
    expect(fc.features[0]?.geometry.type).toBe('Point')
    expect(fc.features[0]?.properties?.color).toBe('#111')
  })

  test('line draft includes vertex points', () => {
    const coords: [number, number][] = [
      [9, 45],
      [9.1, 45.1],
    ]
    const fc = draftToDisplayGeoJson(coords, 'line')
    expect(fc.features.some(f => f.geometry.type === 'LineString')).toBeTruthy()
    expect(
      fc.features.filter(
        f => f.geometry.type === 'Point' && !f.properties?.isArrowHead
      ).length
    ).toBe(2)
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
    expect(head).toBeTruthy()
    expect(head?.properties?.color).toBe('#E85D04')
    expect(typeof head?.properties?.bearing).toBe('number')
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
    expect(poly).toBeTruthy()
    const ring = (poly?.geometry as GeoJSON.Polygon).coordinates[0]!
    expect(ring[0]).toEqual(ring[ring.length - 1])
  })

  test('polygon draft with two points has no polygon geometry yet', () => {
    const fc = draftToDisplayGeoJson(
      [
        [9, 45],
        [9.1, 45],
      ],
      'polygon'
    )
    expect(fc.features.some(f => f.geometry.type === 'Polygon')).toBe(false)
  })
})
