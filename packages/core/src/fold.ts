import type { NamedMoment, SitacEvent, SitacFeature } from './types'

export function foldFeatures(
  events: readonly SitacEvent[],
  untilTs?: string | null
): SitacFeature[] {
  const until = untilTs ? Date.parse(untilTs) : Number.POSITIVE_INFINITY
  const map = new Map<string, SitacFeature>()

  for (const event of events) {
    if (Date.parse(event.ts) > until) continue

    if (event.op === 'upsert_feature') {
      const { featureId, geometry, properties } = event.payload
      map.set(featureId, {
        id: featureId,
        geometry,
        properties,
        updatedAt: event.ts,
      })
    } else if (event.op === 'delete_feature') {
      map.delete(event.payload.featureId)
    }
  }

  return [...map.values()]
}

export function listNamedMoments(events: readonly SitacEvent[]): NamedMoment[] {
  const out: NamedMoment[] = []
  for (const event of events) {
    if (event.op !== 'named_snapshot') continue
    out.push({
      eventId: event.id,
      ts: event.ts,
      name: event.payload.name,
    })
  }
  return out
}

function isMarkEvent(event: SitacEvent): boolean {
  return event.op === 'upsert_feature' || event.op === 'delete_feature'
}

export function listMarkEvents(events: readonly SitacEvent[]): SitacEvent[] {
  return events.filter(isMarkEvent)
}

export function featuresToGeoJson(features: readonly SitacFeature[]) {
  return {
    type: 'FeatureCollection' as const,
    features: features.map(f => ({
      type: 'Feature' as const,
      id: f.id,
      geometry: f.geometry,
      properties: {
        id: f.id,
        ...f.properties,
        updatedAt: f.updatedAt,
      },
    })),
  }
}
