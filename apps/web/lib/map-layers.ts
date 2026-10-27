import type { Map as MapLibreMap } from 'maplibre-gl'
import { SYMBOL_CATALOG } from '@aib-sitac/core'
import { EMPTY_FEATURE_COLLECTION } from '@/lib/map-basemap'
import {
  ARROW_HEAD_IMAGE_ID,
  loadArrowHeadIcon,
  loadSymbolIcon,
} from '@/lib/map-icons'

export async function addSitacSourcesAndLayers(
  map: MapLibreMap
): Promise<void> {
  await Promise.all([
    ...SYMBOL_CATALOG.map(s => loadSymbolIcon(map, s.id, s.color)),
    loadArrowHeadIcon(map),
  ])

  map.addSource('sitac', {
    type: 'geojson',
    data: EMPTY_FEATURE_COLLECTION,
    promoteId: 'id',
  })
  map.addLayer({
    id: 'sitac-fill',
    type: 'fill',
    source: 'sitac',
    filter: [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['!=', ['get', 'isArrowHead'], true],
    ],
    paint: {
      'fill-color': ['coalesce', ['get', 'color'], '#AF2525'],
      'fill-opacity': 0.35,
    },
  })
  map.addLayer({
    id: 'sitac-line',
    type: 'line',
    source: 'sitac',
    filter: [
      'all',
      [
        'any',
        ['==', ['geometry-type'], 'LineString'],
        ['==', ['geometry-type'], 'Polygon'],
      ],
      ['!=', ['get', 'isArrowHead'], true],
    ],
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#AF2525'],
      'line-width': 3,
    },
  })
  map.addLayer({
    id: 'sitac-arrow-head',
    type: 'symbol',
    source: 'sitac',
    filter: ['==', ['get', 'isArrowHead'], true],
    layout: {
      'icon-image': ARROW_HEAD_IMAGE_ID,
      'icon-size': 0.45,
      'icon-rotate': ['coalesce', ['get', 'bearing'], 0],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      'icon-color': ['coalesce', ['get', 'color'], '#AF2525'],
    },
  })
  map.addLayer({
    id: 'sitac-point',
    type: 'symbol',
    source: 'sitac',
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['!=', ['get', 'isArrowHead'], true],
      ['!=', ['get', 'isMarkIcon'], true],
      ['!=', ['get', 'geometryKind'], 'text'],
    ],
    layout: {
      'icon-image': [
        'concat',
        'sitac-icon-',
        ['coalesce', ['get', 'symbolId'], 'hotspot'],
      ],
      'icon-size': 1.15,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })
  map.addLayer({
    id: 'sitac-mark-icon',
    type: 'symbol',
    source: 'sitac',
    filter: ['==', ['get', 'isMarkIcon'], true],
    layout: {
      'icon-image': [
        'concat',
        'sitac-icon-',
        ['coalesce', ['get', 'symbolId'], 'hotspot'],
      ],
      'icon-size': 0.7,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })
  map.addLayer({
    id: 'sitac-text',
    type: 'symbol',
    source: 'sitac',
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['==', ['get', 'geometryKind'], 'text'],
      ['!=', ['get', 'isMarkIcon'], true],
    ],
    layout: {
      'icon-image': [
        'concat',
        'sitac-icon-',
        ['coalesce', ['get', 'symbolId'], 'note'],
      ],
      'icon-size': 0.85,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['coalesce', ['get', 'label'], ['get', 'note'], ''],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 14,
      'text-offset': [0, 1.6],
      'text-anchor': 'top',
      'text-max-width': 14,
      'text-allow-overlap': true,
      'text-optional': false,
    },
    paint: {
      'text-color': '#fafafa',
      'text-halo-color': '#111111',
      'text-halo-width': 1.5,
    },
  })

  map.addSource('draft', {
    type: 'geojson',
    data: EMPTY_FEATURE_COLLECTION,
  })
  map.addLayer({
    id: 'draft-fill',
    type: 'fill',
    source: 'draft',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': ['coalesce', ['get', 'color'], '#171717'],
      'fill-opacity': 0.2,
    },
  })
  map.addLayer({
    id: 'draft-line',
    type: 'line',
    source: 'draft',
    filter: [
      'any',
      ['==', ['geometry-type'], 'LineString'],
      ['==', ['geometry-type'], 'Polygon'],
    ],
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#171717'],
      'line-width': 2,
      'line-dasharray': [2, 2],
    },
  })
  map.addLayer({
    id: 'draft-arrow-head',
    type: 'symbol',
    source: 'draft',
    filter: ['==', ['get', 'isArrowHead'], true],
    layout: {
      'icon-image': ARROW_HEAD_IMAGE_ID,
      'icon-size': 0.4,
      'icon-rotate': ['coalesce', ['get', 'bearing'], 0],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      'icon-color': ['coalesce', ['get', 'color'], '#171717'],
      'icon-opacity': 0.85,
    },
  })
  map.addLayer({
    id: 'draft-point',
    type: 'circle',
    source: 'draft',
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['!=', ['get', 'isArrowHead'], true],
    ],
    paint: {
      'circle-radius': 5,
      'circle-color': ['coalesce', ['get', 'color'], '#171717'],
    },
  })
}

export const PICK_LAYERS = [
  'sitac-text',
  'sitac-mark-icon',
  'sitac-point',
  'sitac-arrow-head',
  'sitac-line',
  'sitac-fill',
] as const
