import { cycleThemePreference } from './theme'

describe('cycleThemePreference', () => {
  test('cycles system → light → dark → system', () => {
    expect(cycleThemePreference('system')).toBe('light')
    expect(cycleThemePreference('light')).toBe('dark')
    expect(cycleThemePreference('dark')).toBe('system')
  })
})
