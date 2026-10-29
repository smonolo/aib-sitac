import { cn } from '@/lib/utils'

export const markIconSize = {
  sidebar: 26,
  timeline: 28,
  control: 22,
  dialog: 32,
} as const

type Props = {
  src: string
  size: number
  className?: string
}

export function MarkIcon({ src, size, className }: Props) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={cn('shrink-0', className)}
    />
  )
}
