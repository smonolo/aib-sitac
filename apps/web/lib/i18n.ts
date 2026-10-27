export const copy = {
  brand: 'AIB SITAC',
  homeAria: 'AIB SITAC — home',
  tagline: 'Mappa di situazione tattica per incendi boschivi',
  unofficial:
    'Strumento indipendente e non ufficiale. Non affiliato a Protezione Civile, Vigili del Fuoco o altre istituzioni.',
  createTitle: 'Nuovo intervento',
  titleLabel: 'Titolo',
  titlePlaceholder: 'es. Incendio Val di …',
  passphraseLabel: 'Password (opzionale)',
  passphraseHint: 'Chi ha il link e la password può modificare la mappa.',
  actorLabel: 'Il tuo nome',
  actorPlaceholder: 'es. Sala / Caposquadra',
  actorDialogTitle: 'Il tuo nome',
  actorDialogHint:
    'Nome visualizzato sulle modifiche alla mappa. Resta solo su questo dispositivo — niente account.',
  actorDialogSave: 'Salva',
  actorDialogLogout: 'Esci',
  actorDialogOpen: 'Profilo',
  actorRequired: 'Imposta un nome prima di modificare la mappa.',
  createCta: 'Crea intervento',
  incidentsList: 'Interventi',
  incidentsEmpty: 'Nessun intervento trovato.',
  incidentsLocked: 'Protetto',
  incidentsSearch: 'Cerca per titolo',
  incidentsFrom: 'Dal',
  incidentsTo: 'Al',
  incidentsPrev: 'Precedenti',
  incidentsNext: 'Successivi',
  incidentsPageOf: 'Pagina {page} / {total}',
  incidentsClear: 'Azzera filtri',
  guide: 'Guida',
  privacy: 'Privacy',
  terms: 'Termini',
  privacyHeading: 'Privacy',
  privacyUpdated: 'Ultimo aggiornamento: 27 ottobre 2026',
  termsHeading: 'Termini di utilizzo',
  termsUpdated: 'Ultimo aggiornamento: 27 ottobre 2026',
  palette: 'Simboli',
  selectTool: 'Cursore',
  timeline: 'Timeline',
  live: 'Ora',
  stepOf: 'Step {current} / {total}',
  prevStep: 'Step precedente',
  nextStep: 'Step successivo',
  timelineAdded: 'Aggiunto',
  timelineRemoved: 'Rimosso',
  timelineUnknownMark: 'Segno',
  exportGeoJson: 'Esporta GeoJSON',
  exportPng: 'Esporta PNG',
  shareLink: 'Copia link',
  copied: 'Copiato',
  roomSettings: 'Impostazioni intervento',
  roomSettingsOpen: 'Impostazioni',
  roomTitleLabel: 'Titolo',
  roomTitleSave: 'Salva titolo',
  roomPassLabel: 'Password',
  roomPassSet: 'Imposta',
  roomPassRemove: 'Rimuovi',
  roomPassProtected: 'Protetto da password',
  roomPassOpen: 'Senza password — chiunque col link può modificare',
  roomPassPlaceholder: 'Nuova password (min. 4)',
  roomPassTooShort: 'Password: minimo 4 caratteri',
  roomSaved: 'Salvato',
  deleteFeature: 'Elimina segno',
  finishDraw: 'Termina',
  cancelDraw: 'Annulla',
  unlock: 'Sblocca',
  passphraseRequired: 'Questa mappa richiede una password.',
  loading: 'Caricamento…',
  error: 'Errore',
  drawHintPoint: 'Clicca sulla mappa per posizionare (anche sopra un’area).',
  drawHintLine:
    'Clicca per aggiungere punti della linea (anche sopra un’area). Doppio clic o «Termina» per chiudere.',
  drawHintArrow:
    'Clicca l’inizio e la punta della freccia (più punti se serve). Doppio clic o «Termina» per chiudere.',
  drawHintPolygon:
    'Clicca i vertici della forma. Doppio clic o «Termina» per chiudere.',
  drawHintText: 'Clicca dove vuoi il testo sulla mappa.',
  selectedMarkHint:
    'Segno selezionato. Usa «Elimina segno» sotto per rimuoverlo dalla mappa.',
  selectToolHint:
    'Clicca un segno sulla mappa per selezionarlo. Il clic sul vuoto non fa nulla.',
  textDialogTitle: 'Testo sulla mappa',
  textDialogPlaceholder: 'Scrivi l’etichetta…',
  textDialogConfirm: 'Aggiungi',
  textDialogCancel: 'Annulla',
  geomPoint: 'punto',
  geomLine: 'linea',
  geomArrow: 'freccia',
  geomArea: 'forma',
  geomText: 'testo',
  noEvents: 'Nessun segno ancora — scegli un simbolo e disegna.',
  symbolHelp: {
    arrow:
      'Disegna una freccia libera sulla mappa per indicare direzione o movimento.',
    shape:
      'Disegna una forma/area libera (almeno 3 vertici) per evidenziare una zona.',
    note: 'Posiziona un’etichetta di testo: dopo il clic si apre la finestra per scriverla.',
    hotspot: 'Segna un punto caldo o un focolaio con un clic sulla mappa.',
    active_front:
      'Traccia la direzione del fronte attivo con una freccia (più clic, poi Termina).',
    burned_area:
      'Disegna il perimetro dell’area già bruciata (almeno 3 vertici, poi Termina).',
    water_point: 'Posiziona un punto acqua o rifornimento con un clic.',
    lookout: 'Segna un osservatorio o punto di vista con un clic.',
    command_post: 'Posiziona il posto di comando / ROS con un clic.',
    vehicle: 'Segna la posizione di un mezzo con un clic.',
    squad: 'Segna la posizione di una squadra con un clic.',
    road_closed:
      'Traccia un tratto di strada chiusa (più clic sulla linea, poi Termina).',
    wind: 'Indica la direzione del vento con una freccia (più clic, poi Termina).',
  },
} as const

export type Copy = typeof copy

export function t(): Copy {
  return copy
}

function formatTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  let out = template
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(`{${key}}`, String(value))
  }
  return out
}

export function geometryKindLabel(
  kind: 'point' | 'line' | 'arrow' | 'polygon' | 'text'
): string {
  if (kind === 'polygon') return copy.geomArea
  if (kind === 'arrow') return copy.geomArrow
  if (kind === 'line') return copy.geomLine
  if (kind === 'text') return copy.geomText
  return copy.geomPoint
}

export function drawHintForGeometry(
  kind: 'point' | 'line' | 'arrow' | 'polygon' | 'text'
): string {
  if (kind === 'text') return copy.drawHintText
  if (kind === 'point') return copy.drawHintPoint
  if (kind === 'arrow') return copy.drawHintArrow
  if (kind === 'polygon') return copy.drawHintPolygon
  return copy.drawHintLine
}

export function formatStepOf(current: number, total: number): string {
  return formatTemplate(copy.stepOf, { current, total })
}

export function formatPageOf(page: number, total: number): string {
  return formatTemplate(copy.incidentsPageOf, { page, total })
}
