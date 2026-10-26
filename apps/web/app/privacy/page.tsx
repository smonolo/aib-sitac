import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[700px] px-4 py-10 text-aib-fg-inverse sm:px-5">
      <Link
        href="/"
        className="text-[13px] font-semibold tracking-[-0.2px] text-aib-fg-inverse hover:opacity-70"
      >
        AIB SITAC
      </Link>
      <h1 className="mt-4 text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
        Privacy
      </h1>
      <p className="mt-2 text-[13px] text-aib-muted-dark">
        Last updated: 26 October 2026
      </p>
      <div className="mt-6 space-y-3.5 text-[15px] leading-relaxed text-aib-muted-dark">
        <p>
          AIB SITAC is an independent, unofficial tactical map for wildfire
          (incendio boschivo) situation tracking. It is not affiliated with
          Protezione Civile, Vigili del Fuoco, or any public institution.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Incident maps and event history are stored on the application
            database operated by the developer when you create or join a room.
          </li>
          <li>
            Optional passphrases protect edit access; knowledge of the link (and
            passphrase if set) is the access control in v1 — there are no user
            accounts.
          </li>
          <li>No analytics SDK is bundled by default.</li>
          <li>
            Browser locale and display name preferences stay in local/session
            storage on your device.
          </li>
          <li>
            Exports (GeoJSON / PNG) leave the app under the rules of wherever
            you save or share them.
          </li>
        </ul>
        <p>
          Contact:{' '}
          <a
            href="mailto:stefano@smnl.dev"
            className="text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
          >
            stefano@smnl.dev
          </a>{' '}
          ·{' '}
          <a
            href="https://smnl.dev/aib-sitac/privacy"
            className="text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
          >
            smnl.dev/aib-sitac/privacy
          </a>
        </p>
      </div>
    </main>
  )
}
