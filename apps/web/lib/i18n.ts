export type Locale = 'it' | 'en'

export const copy = {
  it: {
    brand: 'AIB SITAC',
    tagline: 'Mappa di situazione tattica per incendi boschivi',
    unofficial:
      'Strumento indipendente e non ufficiale. Non affiliato a Protezione Civile, Vigili del Fuoco o altre istituzioni.',
    createTitle: 'Nuovo incidente',
    titleLabel: 'Titolo',
    titlePlaceholder: 'es. Incendio Val di …',
    passphraseLabel: 'Passphrase (opzionale)',
    passphraseHint: 'Chi ha il link e la passphrase può modificare la mappa.',
    actorLabel: 'Il tuo nome (opzionale)',
    actorPlaceholder: 'es. Sala / Caposquadra',
    createCta: 'Apri mappa',
    openExisting: 'Apri incidente esistente',
    incidentIdLabel: 'ID incidente',
    openCta: 'Apri',
    privacy: 'Privacy',
    terms: 'Termini',
    language: 'Lingua',
    palette: 'Simboli',
    timeline: 'Timeline',
    live: 'Ora',
    snapshot: 'Etichetta',
    snapshotName: 'Nome etichetta (opz.)',
    snapshotCta: 'Etichetta salvata',
    snapshotHint:
      'Le etichette sono solo segnalibri opzionali. Non servono per ripercorrere la storia.',
    timelineHint:
      'Ogni segno aggiunto o rimosso è uno step automatico. Trascina lo slider (o ← →) per vedere la mappa a quell’istante. «Ora» torna al live.',
    scrubbingHint:
      'Stai guardando il passato — disegno disabilitato. Torna a «Ora» per modificare.',
    stepOf: 'Step {current} / {total}',
    prevStep: 'Step precedente',
    nextStep: 'Step successivo',
    exportGeoJson: 'Esporta GeoJSON',
    exportPng: 'Esporta PNG',
    shareLink: 'Copia link',
    copied: 'Copiato',
    estimated: 'Stimato',
    deleteFeature: 'Elimina segno',
    finishDraw: 'Termina',
    cancelDraw: 'Annulla',
    unlock: 'Sblocca',
    passphraseRequired: 'Questa mappa richiede una passphrase.',
    loading: 'Caricamento…',
    error: 'Errore',
    drawHintPoint:
      'Clicca sulla mappa per posizionare (anche sopra un’area). Shift+clic per selezionare un segno.',
    drawHintLine:
      'Clicca per aggiungere punti della linea (anche sopra un’area). Doppio clic o «Termina» per chiudere. Shift+clic seleziona.',
    drawHintPolygon:
      'Clicca i vertici dell’area. Doppio clic o «Termina» per chiudere. Shift+clic seleziona un segno.',
    geomPoint: 'punto',
    geomLine: 'linea',
    geomArea: 'area',
    home: 'Home',
    noEvents: 'Nessun segno ancora — scegli un simbolo e disegna.',
    labels: 'Etichette',
  },
  en: {
    brand: 'AIB SITAC',
    tagline: 'Tactical situation map for wildfires',
    unofficial:
      'Independent, unofficial tool. Not affiliated with Protezione Civile, fire services, or any public institution.',
    createTitle: 'New incident',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Fire Valley …',
    passphraseLabel: 'Passphrase (optional)',
    passphraseHint: 'Anyone with the link and passphrase can edit the map.',
    actorLabel: 'Your name (optional)',
    actorPlaceholder: 'e.g. Ops room / Squad lead',
    createCta: 'Open map',
    openExisting: 'Open existing incident',
    incidentIdLabel: 'Incident ID',
    openCta: 'Open',
    privacy: 'Privacy',
    terms: 'Terms',
    language: 'Language',
    palette: 'Symbols',
    timeline: 'Timeline',
    live: 'Now',
    snapshot: 'Label',
    snapshotName: 'Label name (optional)',
    snapshotCta: 'Label saved',
    snapshotHint:
      'Labels are optional bookmarks only. You do not need them to replay history.',
    timelineHint:
      'Every mark added or removed is an automatic step. Drag the slider (or ← →) to see the map at that instant. «Now» returns to live.',
    scrubbingHint:
      'You are viewing the past — drawing is off. Return to «Now» to edit.',
    stepOf: 'Step {current} / {total}',
    prevStep: 'Previous step',
    nextStep: 'Next step',
    exportGeoJson: 'Export GeoJSON',
    exportPng: 'Export PNG',
    shareLink: 'Copy link',
    copied: 'Copied',
    estimated: 'Estimated',
    deleteFeature: 'Delete mark',
    finishDraw: 'Finish',
    cancelDraw: 'Cancel',
    unlock: 'Unlock',
    passphraseRequired: 'This map requires a passphrase.',
    loading: 'Loading…',
    error: 'Error',
    drawHintPoint:
      'Click the map to place (including on top of an area). Shift+click to select a mark.',
    drawHintLine:
      'Click to add line points (including on top of an area). Double-click or Finish to complete. Shift+click selects.',
    drawHintPolygon:
      'Click area vertices. Double-click or Finish to close. Shift+click selects a mark.',
    geomPoint: 'point',
    geomLine: 'line',
    geomArea: 'area',
    home: 'Home',
    noEvents: 'No marks yet — pick a symbol and draw.',
    labels: 'Labels',
  },
} as const

export type Copy = (typeof copy)[Locale]

export function t(locale: Locale): Copy {
  return copy[locale]
}

export function geometryKindLabel(
  kind: 'point' | 'line' | 'arrow' | 'polygon' | 'text',
  locale: Locale
): string {
  const c = t(locale)
  if (kind === 'polygon') return c.geomArea
  if (kind === 'line' || kind === 'arrow') return c.geomLine
  return c.geomPoint
}

export function formatStepOf(
  locale: Locale,
  current: number,
  total: number
): string {
  return t(locale)
    .stepOf.replace('{current}', String(current))
    .replace('{total}', String(total))
}
