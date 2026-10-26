import type { GeometryKind, SymbolId } from './symbols'

export const EVENT_OPS = [
  'upsert_feature',
  'delete_feature',
  'named_snapshot',
  'set_view',
] as const

export type EventOp = (typeof EVENT_OPS)[number]

export type LonLat = [number, number]

export type SitacGeometry =
  | { type: 'Point'; coordinates: LonLat }
  | { type: 'LineString'; coordinates: LonLat[] }
  | { type: 'Polygon'; coordinates: LonLat[][] }

export type FeatureProps = {
  symbolId: SymbolId
  geometryKind: GeometryKind
  label?: string
  note?: string
  estimated?: boolean
  color?: string
}

export type SitacFeature = {
  id: string
  geometry: SitacGeometry
  properties: FeatureProps
  updatedAt: string
}

export type UpsertFeaturePayload = {
  featureId: string
  geometry: SitacGeometry
  properties: FeatureProps
}

export type DeleteFeaturePayload = {
  featureId: string
}

export type NamedSnapshotPayload = {
  name: string
}

export type SetViewPayload = {
  center: LonLat
  zoom: number
}

export type SitacEventPayload =
  | UpsertFeaturePayload
  | DeleteFeaturePayload
  | NamedSnapshotPayload
  | SetViewPayload

type SitacEventBase = {
  id: string
  incidentId: string
  ts: string
  actorLabel: string | null
}

export type SitacEvent =
  | (SitacEventBase & {
      op: 'upsert_feature'
      payload: UpsertFeaturePayload
    })
  | (SitacEventBase & {
      op: 'delete_feature'
      payload: DeleteFeaturePayload
    })
  | (SitacEventBase & {
      op: 'named_snapshot'
      payload: NamedSnapshotPayload
    })
  | (SitacEventBase & { op: 'set_view'; payload: SetViewPayload })

export type SitacIncident = {
  id: string
  title: string
  createdAt: string
  centerLng: number
  centerLat: number
  zoom: number
  hasPassphrase: boolean
  schemaVersion: number
}

export type NamedMoment = {
  eventId: string
  ts: string
  name: string
}

export const DEFAULT_CENTER: { lng: number; lat: number; zoom: number } = {
  lng: 9.19,
  lat: 45.46,
  zoom: 12,
}
