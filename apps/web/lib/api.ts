import type { SitacEvent, SitacIncident } from '@aib-sitac/core'

function apiBase(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  }
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000'
  )
}

export type CreateIncidentInput = {
  title: string
  centerLng?: number
  centerLat?: number
  zoom?: number
  passphrase?: string | null
}

function headers(passphrase?: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (passphrase) h['X-Passphrase'] = passphrase
  return h
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {}
    throw new Error(message || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function createIncident(
  input: CreateIncidentInput
): Promise<SitacIncident> {
  const res = await fetch(`${apiBase()}/api/incidents`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  })
  return parseJson(res)
}

export async function getIncident(
  id: string,
  passphrase?: string | null
): Promise<SitacIncident> {
  const res = await fetch(`${apiBase()}/api/incidents/${id}`, {
    headers: headers(passphrase),
    cache: 'no-store',
  })
  return parseJson(res)
}

export async function listEvents(
  incidentId: string,
  passphrase?: string | null
): Promise<SitacEvent[]> {
  const res = await fetch(`${apiBase()}/api/incidents/${incidentId}/events`, {
    headers: headers(passphrase),
    cache: 'no-store',
  })
  return parseJson(res)
}

export async function appendEvent(
  incidentId: string,
  body: {
    op: SitacEvent['op']
    payload: SitacEvent['payload']
    actorLabel?: string | null
  },
  passphrase?: string | null
): Promise<SitacEvent> {
  const res = await fetch(`${apiBase()}/api/incidents/${incidentId}/events`, {
    method: 'POST',
    headers: headers(passphrase),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export function eventsStreamUrl(incidentId: string): string {
  return `${apiBase()}/api/incidents/${incidentId}/events/stream`
}
