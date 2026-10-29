export const copy = {
  brand: 'AIB SITAC',
  homeAria: 'AIB SITAC — home',
  tagline: 'Mappa di situazione tattica per incendi boschivi',
  unofficial:
    'Strumento indipendente e non ufficiale. Non affiliato a Protezione Civile, Vigili del Fuoco o altre istituzioni.',
  createTitle: 'Nuovo intervento',
  homeModeOpen: 'Cerca',
  homeModeCreate: 'Crea',
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
  incidentsEmpty: 'Nessun intervento trovato.',
  incidentsLocked: 'Protetto',
  incidentsSearch: 'Cerca per titolo',
  incidentsPrev: 'Precedenti',
  incidentsNext: 'Successivi',
  incidentsPageOf: 'Pagina {page} / {total}',
  notFound: 'Non trovato',
  guide: 'Guida',
  privacy: 'Privacy',
  terms: 'Termini',
  aboutOpen: 'Informazioni',
  aboutTitle: 'Informazioni',
  aboutClose: 'Chiudi',
  privacyHeading: 'Privacy',
  privacyUpdated: 'Ultimo aggiornamento: 27 ottobre 2026',
  termsHeading: 'Termini di utilizzo',
  termsUpdated: 'Ultimo aggiornamento: 27 ottobre 2026',
  palette: 'Simboli',
  selectTool: 'Cursore',
  timeline: 'Timeline',
  live: 'Ora',
  stepOf: '{current}/{total}',
  firstStep: 'Primo step',
  prevStep: 'Step precedente',
  nextStep: 'Step successivo',
  lastStep: 'Ultimo step',
  timelineAdded: 'Aggiunto',
  timelineRemoved: 'Rimosso',
  timelineUnknownMark: 'Segno',
  exportOpen: 'Esporta',
  exportTitle: 'Esporta',
  exportClose: 'Chiudi',
  exportGeoJson: 'GeoJSON',
  exportPng: 'PNG',
  shareLink: 'Copia link',
  copied: 'Copiato',
  roomSettings: 'Impostazioni intervento',
  roomSettingsOpen: 'Impostazioni',
  roomInfo: 'Intervento',
  roomCreatedBy: 'Creato da',
  roomCreatedByUnknown: 'Non indicato',
  roomTitleLabel: 'Titolo',
  roomTitleSave: 'Salva titolo',
  roomPassLabel: 'Password',
  roomPassSet: 'Imposta',
  roomPassRemove: 'Rimuovi',
  roomPassProtected: 'Protetto da password',
  roomPassOpen: 'Senza password',
  roomPassOpenHint: 'Senza password — chiunque col link può modificare',
  roomPassPlaceholder: 'Nuova password (min. 4)',
  roomPassTooShort: 'Password: minimo 4 caratteri',
  roomSaved: 'Salvato',
  markControls: 'Controlli segno',
  markInfoOpen: 'Info sul segno',
  markInfoClose: 'Chiudi',
  markInfoPurpose: 'A cosa serve',
  markInfoHow: 'Come si usa',
  deleteFeature: 'Elimina',
  deleteMarkTitle: 'Elimina segno',
  deleteMarkBody:
    'Rimuovere questo segno dalla mappa? L’azione resta nella timeline.',
  deleteMarkBodyNamed:
    'Rimuovere «{name}» dalla mappa? L’azione resta nella timeline.',
  deleteMarkConfirm: 'Elimina',
  deleteMarkCancel: 'Annulla',
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
  selectedMarkHow:
    'Usa «Elimina» per rimuoverlo dalla mappa (conferma richiesta; solo in «Ora», non mentre scrubbi la timeline).',
  selectToolPurpose:
    'Seleziona un segno esistente per vederne i dettagli o rimuoverlo.',
  selectToolHow:
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
  symbolPurpose: {
    arrow: 'Indica una direzione o un movimento sulla mappa.',
    shape: 'Evidenzia una zona con un’area libera.',
    note: 'Aggiunge un’etichetta di testo sulla mappa.',
    hotspot: 'Segna un punto caldo o un focolaio.',
    active_front: 'Indica la direzione del fronte attivo.',
    burned_area: 'Segna il perimetro dell’area già bruciata.',
    water_point: 'Segna un punto acqua o di rifornimento.',
    lookout: 'Segna un osservatorio o punto di vista.',
    command_post: 'Segna il posto di comando.',
    vehicle: 'Segna la posizione di un mezzo.',
    squad: 'Segna la posizione di una squadra.',
    road_closed: 'Segna un tratto di strada chiusa.',
    wind: 'Indica la direzione del vento.',
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
