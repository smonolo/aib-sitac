import type { ComponentType, ReactElement, ReactNode, SVGProps } from 'react'

export type SolarIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
  color?: string
  strokeWidth?: number | string
  isolated?: boolean
}

export type SolarIcon = ComponentType<SolarIconProps> & {
  render?: (
    props: SolarIconProps,
    ref: null
  ) => ReactElement<{ children: ReactNode }>
}

export function solarIconChildren(Icon: SolarIcon): ReactNode {
  if (typeof Icon.render !== 'function') return null
  return Icon.render({}, null).props.children
}
