import { DEFAULT_CENTER, type SitacIncident } from '@aib-sitac/core'
import type { IncidentRow } from '../db/index'

export function incidentFromRow(
  row: IncidentRow,
  options?: { redactMapView?: boolean }
): SitacIncident {
  const hasPassphrase = Boolean(row.passphraseHash)
  const redact = Boolean(options?.redactMapView && hasPassphrase)
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy?.trim() || null,
    centerLng: redact ? DEFAULT_CENTER.lng : row.centerLng,
    centerLat: redact ? DEFAULT_CENTER.lat : row.centerLat,
    zoom: redact ? DEFAULT_CENTER.zoom : row.zoom,
    hasPassphrase,
    schemaVersion: row.schemaVersion,
  }
}
