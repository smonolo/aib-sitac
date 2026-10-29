import { BASEMAP_STYLE, EMPTY_FEATURE_COLLECTION } from './map-basemap'

describe('map basemap', () => {
  test('empty feature collection is empty', () => {
    expect(EMPTY_FEATURE_COLLECTION.type).toBe('FeatureCollection')
    expect(EMPTY_FEATURE_COLLECTION.features.length).toBe(0)
  })

  test('HOT raster style caps tile requests at z19', () => {
    expect(BASEMAP_STYLE.version).toBe(8)
    const osm = BASEMAP_STYLE.sources?.osm
    expect(osm && osm.type === 'raster').toBeTruthy()
    if (osm && osm.type === 'raster') {
      expect(osm.maxzoom).toBe(19)
      expect(Array.isArray(osm.tiles) && osm.tiles.length >= 1).toBeTruthy()
      expect(osm.tiles?.[0]).toMatch(/openstreetmap\.fr\/hot/)
    }
  })
})
