import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[700px] px-4 py-10 text-aib-fg-inverse sm:px-5">
      <Link
        href="/"
        className="text-[13px] font-semibold tracking-[-0.2px] text-aib-fg-inverse hover:opacity-70"
      >
        AIB SITAC
      </Link>
      <h1 className="mt-4 text-[26px] leading-tight font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[28px]">
        Terms of use
      </h1>
      <p className="mt-2 text-[13px] text-aib-muted-dark">
        Last updated: 26 October 2026
      </p>
      <div className="mt-6 space-y-3.5 text-[15px] leading-relaxed text-aib-muted-dark">
        <p>
          AIB SITAC is provided as an unofficial volunteer tool for tactical
          wildfire mapping. It does not replace official channels, emergency
          numbers, or institutional systems.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Use at your own operational judgment; marks may be estimated or
            incomplete.
          </li>
          <li>
            Do not present the tool or its maps as official products of public
            authorities.
          </li>
          <li>
            Source code is licensed under PolyForm Noncommercial 1.0.0; brand
            assets are not licensed for reuse in other products.
          </li>
          <li>The service may change or be withdrawn without notice.</li>
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
            href="https://smnl.dev/aib-sitac/terms"
            className="text-aib-fg-inverse underline underline-offset-2 hover:opacity-70"
          >
            smnl.dev/aib-sitac/terms
          </a>
        </p>
      </div>
    </main>
  )
}
