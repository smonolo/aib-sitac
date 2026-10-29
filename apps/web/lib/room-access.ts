import { DEFAULT_CENTER, type SitacIncident } from '@aib-sitac/core'
import { isPassphraseError } from './api'

export function lockedIncidentStub(id: string, title: string): SitacIncident {
  return {
    id,
    title,
    createdAt: new Date(0).toISOString(),
    createdBy: null,
    centerLng: DEFAULT_CENTER.lng,
    centerLat: DEFAULT_CENTER.lat,
    zoom: DEFAULT_CENTER.zoom,
    hasPassphrase: true,
    schemaVersion: 1,
  }
}

export type UnlockFailure =
  { kind: 'wrong_passphrase' } | { kind: 'other'; message: string }

export function classifyUnlockError(err: unknown): UnlockFailure {
  if (isPassphraseError(err)) return { kind: 'wrong_passphrase' }
  return { kind: 'other', message: String(err) }
}

export type GateLoadResult =
  | { status: 'open'; incident: SitacIncident; passphrase: string | null }
  | { status: 'locked' }
  | { status: 'error'; message: string }

export async function resolveRoomGate(opts: {
  hasPassphrase: boolean
  storedPassphrase: string | null
  loadIncident: (passphrase: string | null) => Promise<SitacIncident>
}): Promise<GateLoadResult> {
  if (!opts.hasPassphrase) {
    try {
      const incident = await opts.loadIncident(null)
      return { status: 'open', incident, passphrase: null }
    } catch (err) {
      return { status: 'error', message: String(err) }
    }
  }

  if (!opts.storedPassphrase) return { status: 'locked' }

  try {
    const incident = await opts.loadIncident(opts.storedPassphrase)
    return {
      status: 'open',
      incident,
      passphrase: opts.storedPassphrase,
    }
  } catch (err) {
    if (isPassphraseError(err)) return { status: 'locked' }
    return { status: 'error', message: String(err) }
  }
}

export function unlockErrorMessage(
  failure: UnlockFailure,
  copy: { passphraseWrong: string }
): string {
  if (failure.kind === 'wrong_passphrase') return copy.passphraseWrong
  return failure.message
}
