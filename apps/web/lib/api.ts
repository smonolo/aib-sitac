import type {
  ListIncidentsQuery,
  ListIncidentsResult,
  SitacEvent,
  SitacIncident,
} from '@aib-sitac/core'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isPassphraseError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403)
}

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

type CreateIncidentInput = {
  title: string
  centerLng?: number
  centerLat?: number
  zoom?: number
  passphrase?: string | null
  createdBy?: string | null
}

function headers(passphrase?: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (passphrase) h['X-Passphrase'] = passphrase
  return h
}

const fetchDefaults: RequestInit = { credentials: 'omit' }

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (typeof body.message === 'string') message = body.message
      else if (Array.isArray(body.message) && body.message[0]) {
        message = body.message[0]
      }
    } catch {}
    throw new ApiError(message || `HTTP ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}

export async function createIncident(
  input: CreateIncidentInput
): Promise<SitacIncident> {
  const res = await fetch(`${apiBase()}/api/incidents`, {
    ...fetchDefaults,
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  })
  return parseJson(res)
}

export async function listIncidents(
  query: ListIncidentsQuery = {}
): Promise<ListIncidentsResult> {
  const params = new URLSearchParams()
  if (query.q?.trim()) params.set('q', query.q.trim())
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const qs = params.toString()
  const res = await fetch(`${apiBase()}/api/incidents${qs ? `?${qs}` : ''}`, {
    ...fetchDefaults,
    cache: 'no-store',
  })
  return parseJson(res)
}

export async function getIncidentGate(
  id: string
): Promise<{ hasPassphrase: boolean }> {
  const res = await fetch(`${apiBase()}/api/incidents/${id}/gate`, {
    ...fetchDefaults,
    cache: 'no-store',
  })
  return parseJson(res)
}

export async function getIncident(
  id: string,
  passphrase?: string | null
): Promise<SitacIncident> {
  const res = await fetch(`${apiBase()}/api/incidents/${id}`, {
    ...fetchDefaults,
    headers: headers(passphrase),
    cache: 'no-store',
  })
  return parseJson(res)
}

type UpdateIncidentInput = {
  title?: string
  passphrase?: string | null
}

export async function updateIncident(
  id: string,
  input: UpdateIncidentInput,
  passphrase?: string | null
): Promise<SitacIncident> {
  const res = await fetch(`${apiBase()}/api/incidents/${id}`, {
    ...fetchDefaults,
    method: 'PATCH',
    headers: headers(passphrase),
    body: JSON.stringify(input),
  })
  return parseJson(res)
}

export async function listEvents(
  incidentId: string,
  passphrase?: string | null
): Promise<SitacEvent[]> {
  const res = await fetch(`${apiBase()}/api/incidents/${incidentId}/events`, {
    ...fetchDefaults,
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
    ...fetchDefaults,
    method: 'POST',
    headers: headers(passphrase),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export function eventsStreamUrl(incidentId: string): string {
  return `${apiBase()}/api/incidents/${incidentId}/events/stream`
}
