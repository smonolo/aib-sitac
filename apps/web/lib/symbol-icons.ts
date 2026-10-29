import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Ban,
  Binoculars,
  Droplet,
  Flag,
  Flame,
  Shapes,
  TreePine,
  TriangleAlert,
  Truck,
  Type,
  Users,
  Wind,
} from 'lucide-react'
import type { SymbolId } from '@aib-sitac/core'

export const SYMBOL_ICONS: Record<SymbolId, LucideIcon> = {
  arrow: ArrowRight,
  shape: Shapes,
  note: Type,
  hotspot: Flame,
  active_front: TriangleAlert,
  burned_area: TreePine,
  water_point: Droplet,
  lookout: Binoculars,
  command_post: Flag,
  vehicle: Truck,
  squad: Users,
  road_closed: Ban,
  wind: Wind,
}
