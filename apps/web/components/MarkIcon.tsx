import type { CSSProperties } from 'react'
import { getSymbol, isAnnotationSymbol, type SymbolId } from '@aib-sitac/core'
import { markGlyphColor } from '@/lib/mark-icon-color'
import { SYMBOL_ICONS } from '@/lib/symbol-icons'
import { cn } from '@/lib/utils'

export const markIconSize = {
  sidebar: 26,
  timeline: 28,
  control: 22,
  dialog: 32,
} as const

type Props = {
  symbolId: SymbolId
  size: number
  className?: string
  sidebar?: boolean
  active?: boolean
}

const ANNOTATION_BADGE_DARK = '#171717'
const ANNOTATION_BADGE_LIGHT = '#ffffff'

export function MarkIcon({
  symbolId,
  size,
  className,
  sidebar = false,
  active = false,
}: Props) {
  const Icon = SYMBOL_ICONS[symbolId]
  const glyph = Math.max(12, Math.round(size * 0.55))
  const annotation = isAnnotationSymbol(symbolId)
  const catalogColor = getSymbol(symbolId)?.color ?? ANNOTATION_BADGE_DARK

  let lightBadge = annotation ? ANNOTATION_BADGE_DARK : catalogColor
  let darkBadge = lightBadge
  if (annotation && sidebar) {
    lightBadge = active ? ANNOTATION_BADGE_LIGHT : ANNOTATION_BADGE_DARK
    darkBadge = active ? ANNOTATION_BADGE_DARK : ANNOTATION_BADGE_LIGHT
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        '[background-color:var(--mark-badge)] [color:var(--mark-glyph)]',
        'dark:[background-color:var(--mark-badge-dark)] dark:[color:var(--mark-glyph-dark)]',
        className
      )}
      style={
        {
          width: size,
          height: size,
          borderRadius: size * 0.1875,
          '--mark-badge': lightBadge,
          '--mark-glyph': markGlyphColor(lightBadge),
          '--mark-badge-dark': darkBadge,
          '--mark-glyph-dark': markGlyphColor(darkBadge),
        } as CSSProperties
      }
      aria-hidden
    >
      <Icon size={glyph} strokeWidth={2.25} absoluteStrokeWidth={false} />
    </span>
  )
}
