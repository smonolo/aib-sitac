import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { BASEMAP_STYLE, EMPTY_FEATURE_COLLECTION } from './map-basemap'

describe('map basemap', () => {
  test('empty feature collection is empty', () => {
    assert.equal(EMPTY_FEATURE_COLLECTION.type, 'FeatureCollection')
    assert.equal(EMPTY_FEATURE_COLLECTION.features.length, 0)
  })

  test('HOT raster style caps tile requests at z19', () => {
    assert.equal(BASEMAP_STYLE.version, 8)
    const osm = BASEMAP_STYLE.sources?.osm
    assert.ok(osm && osm.type === 'raster')
    if (osm && osm.type === 'raster') {
      assert.equal(osm.maxzoom, 19)
      assert.ok(Array.isArray(osm.tiles) && osm.tiles.length >= 1)
      assert.match(osm.tiles[0]!, /openstreetmap\.fr\/hot/)
    }
  })
})
