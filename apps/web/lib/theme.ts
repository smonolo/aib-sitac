export type ThemePreference = 'system' | 'light' | 'dark'
type ColorScheme = 'light' | 'dark'

const THEME_KEY = 'aib-sitac-theme'

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {}
  return 'system'
}

function writeThemePreference(preference: ThemePreference): void {
  window.localStorage.setItem(THEME_KEY, preference)
}

function systemColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveColorScheme(
  preference: ThemePreference = readThemePreference()
): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference
  return systemColorScheme()
}

function applyColorScheme(scheme: ColorScheme): void {
  document.documentElement.classList.toggle('dark', scheme === 'dark')
}

export function applyThemePreference(preference: ThemePreference): void {
  writeThemePreference(preference)
  applyColorScheme(resolveColorScheme(preference))
}

export function cycleThemePreference(
  current: ThemePreference
): ThemePreference {
  if (current === 'system') return 'light'
  if (current === 'light') return 'dark'
  return 'system'
}

export const themeBootScript = `(function(){try{var k=${JSON.stringify(THEME_KEY)};var p=localStorage.getItem(k);if(p!=='light'&&p!=='dark'&&p!=='system')p='system';var dark=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`
