export function readTimelineStepParam(
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): number | null {
  const raw = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search
  ).get('step')
  if (raw == null || raw === '') return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

export function roomUrlWithTimelineStep(
  href: string,
  step1Based: number | null
): string {
  const url = new URL(href)
  if (step1Based == null) url.searchParams.delete('step')
  else url.searchParams.set('step', String(step1Based))
  return url.toString()
}

export function writeTimelineStepParam(step1Based: number | null): void {
  if (typeof window === 'undefined') return
  const next = roomUrlWithTimelineStep(window.location.href, step1Based)
  if (next === window.location.href) return
  const relative = next.slice(window.location.origin.length)
  window.history.replaceState(window.history.state, '', relative)
}

export function markScrubIndex(
  markEvents: readonly { ts: string }[],
  scrubTs: string | null
): number {
  if (markEvents.length === 0) return 0
  if (scrubTs == null) return markEvents.length - 1
  const scrubMs = Date.parse(scrubTs)
  let idx = 0
  for (let i = 0; i < markEvents.length; i++) {
    if (Date.parse(markEvents[i]!.ts) <= scrubMs) idx = i
    else break
  }
  return idx
}
