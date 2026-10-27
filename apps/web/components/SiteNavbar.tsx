'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import { ActorDialog } from '@/components/ActorDialog'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { readActor } from '@/lib/storage'

export function SiteNavbar() {
  const c = t()
  const [open, setOpen] = useState(false)
  const [actor, setActor] = useState('')

  useEffect(() => {
    setActor(readActor())
  }, [])

  return (
    <>
      <header
        className="z-20 shrink-0 border-b border-aib-border-dark bg-aib-canvas-inverse"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex h-11 w-full items-center justify-between gap-2 px-4 sm:h-12 sm:gap-3 sm:px-5">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 no-underline transition-opacity hover:opacity-70"
            aria-label={c.homeAria}
          >
            <Image
              src="/aib-assets/logo.png"
              alt=""
              width={350}
              height={180}
              className="h-4.5 w-auto sm:h-5"
              priority
            />
            <span className="text-[18px] font-bold tracking-[-0.4px] text-aib-fg-inverse sm:text-[20px]">
              SITAC
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="max-w-[10rem] gap-1.5 text-aib-muted-dark"
            aria-label={c.actorDialogOpen}
            onClick={() => setOpen(true)}
          >
            <User className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{actor || c.actorDialogOpen}</span>
          </Button>
        </div>
      </header>
      <ActorDialog
        open={open}
        onClose={() => setOpen(false)}
        onChange={setActor}
      />
    </>
  )
}
