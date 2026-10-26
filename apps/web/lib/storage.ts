import type { Locale } from './i18n'

const LOCALE_KEY = 'aib-sitac-locale'
const ACTOR_KEY = 'aib-sitac-actor'

function passKey(incidentId: string): string {
  return `aib-sitac-pass:${incidentId}`
}

export function readLocale(): Locale {
  return (window.localStorage.getItem(LOCALE_KEY) as Locale) || 'it'
}

export function writeLocale(locale: Locale): void {
  window.localStorage.setItem(LOCALE_KEY, locale)
}

export function readActor(): string {
  return window.localStorage.getItem(ACTOR_KEY) ?? ''
}

export function writeActor(actor: string): void {
  window.localStorage.setItem(ACTOR_KEY, actor)
}

export function readPassphrase(incidentId: string): string | null {
  return window.sessionStorage.getItem(passKey(incidentId))
}

export function writePassphrase(incidentId: string, passphrase: string): void {
  window.sessionStorage.setItem(passKey(incidentId), passphrase)
}

export function formatTs(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB', {
    timeZone: 'Europe/Rome',
  })
}
