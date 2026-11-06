import { ArrowRightIcon } from '@solar-icons/react/linear/arrow-right'
import { BinocularsIcon } from '@solar-icons/react/linear/binoculars'
import { BusIcon } from '@solar-icons/react/linear/bus'
import { DangerTriangleIcon } from '@solar-icons/react/linear/danger-triangle'
import { FireIcon } from '@solar-icons/react/linear/fire'
import { FlagIcon } from '@solar-icons/react/linear/flag'
import { ForbiddenIcon } from '@solar-icons/react/linear/forbidden'
import { LeafIcon } from '@solar-icons/react/linear/leaf'
import { TextFieldIcon } from '@solar-icons/react/linear/text-field'
import { UsersGroupRoundedIcon } from '@solar-icons/react/linear/users-group-rounded'
import { WaterdropIcon } from '@solar-icons/react/linear/waterdrop'
import { WidgetIcon } from '@solar-icons/react/linear/widget'
import { WindIcon } from '@solar-icons/react/linear/wind'
import type { SymbolId } from '@aib-sitac/core'
import type { SolarIcon } from '@/lib/solar-icon'

export const SYMBOL_ICONS: Record<SymbolId, SolarIcon> = {
  arrow: ArrowRightIcon,
  shape: WidgetIcon,
  note: TextFieldIcon,
  hotspot: FireIcon,
  active_front: DangerTriangleIcon,
  burned_area: LeafIcon,
  water_point: WaterdropIcon,
  lookout: BinocularsIcon,
  command_post: FlagIcon,
  vehicle: BusIcon,
  squad: UsersGroupRoundedIcon,
  road_closed: ForbiddenIcon,
  wind: WindIcon,
}
