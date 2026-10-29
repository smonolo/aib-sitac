import type { LonLat, SitacGeometry } from './types'

export function translateGeometry(
  geometry: SitacGeometry,
  dLng: number,
  dLat: number
): SitacGeometry {
  const shift = (point: LonLat): LonLat => [point[0] + dLng, point[1] + dLat]
  if (geometry.type === 'Point') {
    return { type: 'Point', coordinates: shift(geometry.coordinates) }
  }
  if (geometry.type === 'LineString') {
    return {
      type: 'LineString',
      coordinates: geometry.coordinates.map(shift),
    }
  }
  return {
    type: 'Polygon',
    coordinates: geometry.coordinates.map(ring => ring.map(shift)),
  }
}

export function lineBearingDegrees(from: LonLat, to: LonLat): number {
  const [lng1, lat1] = from
  const [lng2, lat2] = to
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function lineMidpoint(coords: readonly LonLat[]): LonLat {
  if (coords.length === 0) return [0, 0]
  if (coords.length === 1) return coords[0]!
  const mid = Math.floor(coords.length / 2)
  if (coords.length % 2 === 1) return coords[mid]!
  const a = coords[mid - 1]!
  const b = coords[mid]!
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
}

export function ringCentroid(ring: readonly LonLat[]): LonLat {
  if (ring.length === 0) return [0, 0]
  const first = ring[0]!
  const last = ring[ring.length - 1]!
  const pts =
    ring.length > 1 && first[0] === last[0] && first[1] === last[1]
      ? ring.slice(0, -1)
      : ring
  if (pts.length === 0) return first
  let lng = 0
  let lat = 0
  for (const p of pts) {
    lng += p[0]
    lat += p[1]
  }
  return [lng / pts.length, lat / pts.length]
}
