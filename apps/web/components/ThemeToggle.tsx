'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import {
  applyThemePreference,
  cycleThemePreference,
  readThemePreference,
  type ThemePreference,
} from '@/lib/theme'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  size?: 'xs' | 'sm'
}

export function ThemeToggle({ className, size = 'xs' }: Props) {
  const c = t()
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    setPreference(readThemePreference())
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readThemePreference() === 'system') {
        applyThemePreference('system')
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const label =
    preference === 'light'
      ? c.themeLight
      : preference === 'dark'
        ? c.themeDark
        : c.themeSystem

  const aria = `${c.themeToggle}: ${label}`
  const Icon =
    preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={cn(
        'gap-1.5 text-aib-muted dark:text-aib-muted-dark',
        className
      )}
      aria-label={aria}
      title={aria}
      onClick={() => {
        const next = cycleThemePreference(preference)
        applyThemePreference(next)
        setPreference(next)
      }}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
