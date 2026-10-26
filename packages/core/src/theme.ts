export const brand = '#AF2525' as const

export const palette = {
  light: {
    canvas: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceMuted: '#E5E5E5',
    fg: '#171717',
    fgInverse: '#FAFAFA',
    muted: '#525252',
    border: '#E5E5E5',
    borderStrong: '#D4D4D4',
    track: '#E5E5E5',
    trackActive: '#404040',
    trackIdle: '#525252',
    placeholder: '#A3A3A3',
    selection: '#525252',
    brand,
  },
  dark: {
    canvas: '#111111',
    surface: '#1A1A1A',
    surfaceMuted: '#262626',
    fg: '#FAFAFA',
    fgInverse: '#171717',
    muted: '#A3A3A3',
    border: '#2A2A2A',
    borderStrong: '#525252',
    track: '#262626',
    trackActive: '#404040',
    trackIdle: '#D4D4D4',
    placeholder: '#737373',
    selection: '#A3A3A3',
    brand,
  },
} as const

export const radii = {
  sm: 12,
  md: 16,
  full: 999,
} as const

export type AppColorScheme = 'light' | 'dark'
export type AppColors = {
  [K in keyof (typeof palette)['light']]: string
}

export function colorsFor(scheme: AppColorScheme): AppColors {
  return scheme === 'dark' ? palette.dark : palette.light
}
