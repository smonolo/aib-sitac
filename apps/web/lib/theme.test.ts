import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { cycleThemePreference } from './theme'

describe('cycleThemePreference', () => {
  test('cycles system → light → dark → system', () => {
    assert.equal(cycleThemePreference('system'), 'light')
    assert.equal(cycleThemePreference('light'), 'dark')
    assert.equal(cycleThemePreference('dark'), 'system')
  })
})
