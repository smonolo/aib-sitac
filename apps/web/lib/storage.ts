import { ROME_TZ } from '@aib-sitac/core'

const ACTOR_KEY = 'aib-sitac-actor'

function passKey(incidentId: string): string {
  return `aib-sitac-pass:${incidentId}`
}

export function readActor(): string {
  return window.localStorage.getItem(ACTOR_KEY) ?? ''
}

export function writeActor(actor: string): void {
  const trimmed = actor.trim()
  if (!trimmed) {
    window.localStorage.removeItem(ACTOR_KEY)
    return
  }
  window.localStorage.setItem(ACTOR_KEY, trimmed)
}

export function clearActor(): void {
  window.localStorage.removeItem(ACTOR_KEY)
}

export function readPassphrase(incidentId: string): string | null {
  return window.sessionStorage.getItem(passKey(incidentId))
}

export function writePassphrase(incidentId: string, passphrase: string): void {
  window.sessionStorage.setItem(passKey(incidentId), passphrase)
}

export function clearPassphrase(incidentId: string): void {
  window.sessionStorage.removeItem(passKey(incidentId))
}

export function formatTs(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', { timeZone: ROME_TZ })
}
