'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const linkBase =
  'inline-flex min-h-8 items-center text-[12px] font-medium no-underline transition-opacity hover:opacity-70 sm:min-h-0 sm:text-[13px]'

export function SiteFooter() {
  const pathname = usePathname()
  const c = t()

  const navClass = (href: string) => {
    const active =
      href === '/'
        ? pathname === '/'
        : pathname === href || pathname.startsWith(`${href}/`)
    return cn(linkBase, active ? 'text-aib-fg-inverse' : 'text-aib-muted-dark')
  }

  return (
    <footer className="w-full shrink-0 border-t border-aib-border-dark bg-aib-canvas-inverse">
      <div
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[13px] font-medium text-aib-muted-dark sm:px-5"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <nav
          className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
          aria-label={c.brand}
        >
          <a
            href="https://smnl.dev/aib-sitac/guide"
            className={cn(linkBase, 'text-aib-muted-dark')}
            target="_blank"
            rel="noreferrer"
          >
            {c.guide}
          </a>
          <Link href="/privacy" className={navClass('/privacy')}>
            {c.privacy}
          </Link>
          <Link href="/terms" className={navClass('/terms')}>
            {c.terms}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
