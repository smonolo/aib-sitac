import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left'
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right'
import { BookIcon } from '@solar-icons/react/linear/book'
import { BracesIcon } from '@solar-icons/react/linear/braces'
import { CloseIcon } from '@solar-icons/react/linear/close'
import { CursorIcon } from '@solar-icons/react/linear/cursor'
import { DocumentTextIcon } from '@solar-icons/react/linear/document-text'
import { DoubleAltArrowLeftIcon } from '@solar-icons/react/linear/double-alt-arrow-left'
import { DoubleAltArrowRightIcon } from '@solar-icons/react/linear/double-alt-arrow-right'
import { DownloadIcon } from '@solar-icons/react/linear/download'
import { GalleryIcon } from '@solar-icons/react/linear/gallery'
import { HamburgerMenuIcon } from '@solar-icons/react/linear/hamburger-menu'
import { InfoCircleIcon } from '@solar-icons/react/linear/info-circle'
import { LinkRoundIcon } from '@solar-icons/react/linear/link-round'
import { LockIcon } from '@solar-icons/react/linear/lock'
import { MonitorSmartphoneIcon } from '@solar-icons/react/linear/monitor-smartphone'
import { MoonIcon } from '@solar-icons/react/linear/moon'
import { NotesIcon } from '@solar-icons/react/linear/notes'
import { QuestionCircleIcon } from '@solar-icons/react/linear/question-circle'
import { SettingsIcon } from '@solar-icons/react/linear/settings'
import { Sun2Icon } from '@solar-icons/react/linear/sun-2'
import { UserIcon } from '@solar-icons/react/linear/user'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

const ICONS = {
  close: CloseIcon,
  help: QuestionCircleIcon,
  lock: LockIcon,
  user: UserIcon,
  book: BookIcon,
  document: DocumentTextIcon,
  notes: NotesIcon,
  braces: BracesIcon,
  gallery: GalleryIcon,
  devices: MonitorSmartphoneIcon,
  sun: Sun2Icon,
  moon: MoonIcon,
  chevronLeft: AltArrowLeftIcon,
  chevronRight: AltArrowRightIcon,
  chevronsLeft: DoubleAltArrowLeftIcon,
  chevronsRight: DoubleAltArrowRightIcon,
  download: DownloadIcon,
  info: InfoCircleIcon,
  link: LinkRoundIcon,
  menu: HamburgerMenuIcon,
  cursor: CursorIcon,
  settings: SettingsIcon,
} as const

export type AppIconName = keyof typeof ICONS

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
  color?: string
  strokeWidth?: number
}

export function AppIcon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.5,
  className,
}: {
  name: AppIconName
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}) {
  const Icon = ICONS[name] as ComponentType<IconProps>
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
      aria-hidden
    />
  )
}
