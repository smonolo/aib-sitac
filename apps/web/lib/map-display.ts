import {
  lineBearingDegrees,
  lineMidpoint,
  ringCentroid,
  type LonLat,
  type SitacFeature,
} from '@aib-sitac/core'

type DisplayFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>

function markIconPoint(
  feature: SitacFeature,
  coordinates: LonLat
): DisplayFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      id: feature.id,
      symbolId: feature.properties.symbolId,
      color: feature.properties.color,
      geometryKind: feature.properties.geometryKind,
      isArrowHead: false,
      isMarkIcon: true,
    },
  }
}

function arrowHeadFeature(
  from: LonLat,
  to: LonLat,
  props: Record<string, unknown>
): DisplayFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: to },
    properties: {
      isArrowHead: true,
      isMarkIcon: false,
      bearing: lineBearingDegrees(from, to),
      ...props,
    },
  }
}

export function featuresToDisplayGeoJson(
  features: readonly SitacFeature[]
): GeoJSON.FeatureCollection {
  const out: DisplayFeature[] = []

  for (const feature of features) {
    out.push({
      type: 'Feature',
      id: feature.id,
      geometry: feature.geometry,
      properties: {
        id: feature.id,
        ...feature.properties,
        updatedAt: feature.updatedAt,
        isArrowHead: false,
        isMarkIcon: false,
      },
    })

    if (
      feature.geometry.type === 'LineString' &&
      feature.geometry.coordinates.length >= 1
    ) {
      const coords = feature.geometry.coordinates as LonLat[]
      out.push(markIconPoint(feature, lineMidpoint(coords)))

      if (feature.properties.geometryKind === 'arrow' && coords.length >= 2) {
        const to = coords[coords.length - 1]!
        const from = coords[coords.length - 2]!
        out.push(
          arrowHeadFeature(from, to, {
            id: feature.id,
            color: feature.properties.color,
            geometryKind: 'arrow',
          })
        )
      }
    }

    if (
      feature.geometry.type === 'Polygon' &&
      feature.geometry.coordinates[0] &&
      feature.geometry.coordinates[0].length >= 3
    ) {
      out.push(
        markIconPoint(
          feature,
          ringCentroid(feature.geometry.coordinates[0] as LonLat[])
        )
      )
    }
  }

  return { type: 'FeatureCollection', features: out }
}

export function draftToDisplayGeoJson(
  coords: LonLat[],
  kind: 'line' | 'arrow' | 'polygon' | null,
  color = '#171717'
): GeoJSON.FeatureCollection {
  const features: DisplayFeature[] = []
  if (coords.length === 0 || !kind) {
    return { type: 'FeatureCollection', features }
  }

  if (coords.length === 1) {
    features.push({
      type: 'Feature',
      properties: { isArrowHead: false, isMarkIcon: false, color },
      geometry: { type: 'Point', coordinates: coords[0]! },
    })
    return { type: 'FeatureCollection', features }
  }

  features.push({
    type: 'Feature',
    properties: { isArrowHead: false, isMarkIcon: false, color },
    geometry: { type: 'LineString', coordinates: coords },
  })

  if (kind === 'polygon' && coords.length >= 3) {
    features.push({
      type: 'Feature',
      properties: { isArrowHead: false, isMarkIcon: false, color },
      geometry: {
        type: 'Polygon',
        coordinates: [[...coords, coords[0]!]],
      },
    })
  }

  if (kind === 'arrow') {
    const to = coords[coords.length - 1]!
    const from = coords[coords.length - 2]!
    features.push(arrowHeadFeature(from, to, { color }))
  }

  for (const point of coords) {
    features.push({
      type: 'Feature',
      properties: { isArrowHead: false, isMarkIcon: false, color },
      geometry: { type: 'Point', coordinates: point },
    })
  }

  return { type: 'FeatureCollection', features }
}
