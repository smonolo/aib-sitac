import { t } from '@/lib/i18n'

export default function TermsPage() {
  const c = t()

  return (
    <article className="mx-auto max-w-[700px] space-y-4">
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
        {c.termsHeading}
      </h1>
      <p className="text-[13px] text-aib-muted-dark">{c.termsUpdated}</p>
      <div className="space-y-3.5 text-[15px] leading-relaxed text-aib-muted-dark">
        <p>
          AIB SITAC è uno strumento di volontariato non ufficiale per la mappa
          tattica di incendi boschivi. Non sostituisce i numeri di emergenza, i
          canali ufficiali né i sistemi istituzionali.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Lo usi con giudizio operativo: i segni possono essere stimati,
            incompleti o non aggiornati.
          </li>
          <li>
            Non presentarlo (né le mappe) come prodotto ufficiale di autorità
            pubbliche.
          </li>
          <li>
            Il codice è sotto PolyForm Noncommercial 1.0.0; nome e asset di
            brand non sono concessi per riuso in altri prodotti.
          </li>
          <li>
            Il servizio può cambiare, interrompersi o essere ritirato senza
            preavviso.
          </li>
          <li>
            Non abusare dell’API (scraping automatico, spam di stanze, tentativi
            di forzare la password).
          </li>
        </ul>
        <p>
          Contatto:{' '}
          <a href="mailto:stefano@smnl.dev" className="aib-link">
            stefano@smnl.dev
          </a>{' '}
          ·{' '}
          <a
            href="https://smnl.dev/aib-sitac/terms"
            className="aib-link"
            target="_blank"
            rel="noreferrer"
          >
            smnl.dev/aib-sitac/terms
          </a>
        </p>
      </div>
    </article>
  )
}
