import { t } from '@/lib/i18n'

export default function PrivacyPage() {
  const c = t()

  return (
    <article className="mx-auto max-w-[700px] space-y-4">
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
        {c.privacyHeading}
      </h1>
      <p className="text-[13px] text-aib-muted-dark">{c.privacyUpdated}</p>
      <div className="space-y-3.5 text-[15px] leading-relaxed text-aib-muted-dark">
        <p>
          AIB SITAC è uno strumento indipendente e non ufficiale per mappe di
          situazione tattica su incendi boschivi. Non è affiliato a Protezione
          Civile, Vigili del Fuoco, Regione Lombardia o altre istituzioni
          pubbliche.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Metadati dell’intervento e lo storico eventi (segni) sono salvati
            nel database PostgreSQL del prodotto quando crei o apri una stanza.
          </li>
          <li>
            Niente account in v1: l’accesso è il link dell’intervento e, se
            impostata, la password (solo header HTTP, mai nell’URL; l’API
            conserva un hash e limita i tentativi errati).
          </li>
          <li>Nessun SDK analytics incluso di default.</li>
          <li>
            Il nome visualizzato opzionale (icona utente in alto) resta nella
            memoria locale del browser — niente account.
          </li>
          <li>
            Export (GeoJSON / PNG) e link condivisi escono dall’app secondo le
            regole degli strumenti in cui li salvi o inoltri.
          </li>
        </ul>
        <p>
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
      </div>
    </article>
  )
}
