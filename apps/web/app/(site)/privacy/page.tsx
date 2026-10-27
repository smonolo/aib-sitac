import { t } from '@/lib/i18n'

export default function PrivacyPage() {
  const c = t()

  return (
    <article className="mx-auto max-w-[700px] space-y-8">
      <header className="space-y-3">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
          {c.privacyHeading}
        </h1>
        <p className="text-[13px] font-medium text-aib-muted-dark">
          {c.privacyUpdated}
        </p>
      </header>

      <div className="space-y-3.5 text-[15px] leading-relaxed text-aib-muted-dark">
        <p>
          AIB SITAC è uno strumento indipendente e non ufficiale per mappe di
          situazione tattica su incendi boschivi. Non è affiliato a Protezione
          Civile, Vigili del Fuoco, Regione Lombardia o altre istituzioni
          pubbliche.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold text-aib-fg-inverse">
          In sintesi
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-aib-muted-dark">
          <li>
            Metadati dell’intervento e lo storico eventi (segni) sono salvati
            nel database PostgreSQL del prodotto quando crei o apri una stanza.
          </li>
          <li>
            L’elenco interventi in home è pubblico (titolo, data Europe/Rome, se
            protetto); aprire la mappa resta vincolato al link e, se impostata,
            alla password.
          </li>
          <li>
            Niente account in v1: l’accesso è il link dell’intervento e, se
            impostata, la password (solo header HTTP, mai nell’URL; l’API
            conserva un hash e limita i tentativi errati). Dopo lo sblocco la
            password resta in sessionStorage per quella stanza.
          </li>
          <li>Nessun SDK analytics incluso di default.</li>
          <li>
            Il nome visualizzato opzionale (icona utente in alto) resta in
            localStorage; quando segni la mappa viene copiato sull’evento.
          </li>
          <li>
            Le tile della mappa arrivano da server HOT OSM / openstreetmap.fr,
            che possono vedere IP e coordinate delle tile richieste.
          </li>
          <li>
            Export (GeoJSON / PNG) e link condivisi escono dall’app secondo le
            regole degli strumenti in cui li salvi o inoltri.
          </li>
        </ul>
      </section>

      <p className="text-[15px] leading-relaxed text-aib-muted-dark">
        Contatto:{' '}
        <a href="mailto:stefano@smnl.dev" className="aib-link">
          stefano@smnl.dev
        </a>{' '}
        ·{' '}
        <a
          href="https://smnl.dev/aib-sitac/privacy"
          className="aib-link"
          target="_blank"
          rel="noreferrer"
        >
          smnl.dev/aib-sitac/privacy
        </a>
      </p>
    </article>
  )
}
