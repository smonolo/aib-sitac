import {
  clearActor,
  clearPassphrase,
  formatTs,
  readActor,
  readPassphrase,
  writeActor,
  writePassphrase,
} from './storage'

describe('actor storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('read/write/clear actor trims and removes blanks', () => {
    expect(readActor()).toBe('')
    writeActor('  Sala  ')
    expect(readActor()).toBe('Sala')
    writeActor('   ')
    expect(readActor()).toBe('')
    writeActor('Capo')
    clearActor()
    expect(readActor()).toBe('')
  })
})

describe('passphrase session storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  test('scopes passphrase per incident id', () => {
    writePassphrase('a', 'one')
    writePassphrase('b', 'two')
    expect(readPassphrase('a')).toBe('one')
    expect(readPassphrase('b')).toBe('two')
    clearPassphrase('a')
    expect(readPassphrase('a')).toBe(null)
    expect(readPassphrase('b')).toBe('two')
  })

  test('missing passphrase is null', () => {
    expect(readPassphrase('missing')).toBe(null)
  })
})

describe('formatTs', () => {
  test('formats ISO timestamps for it-IT Rome', () => {
    const out = formatTs('2026-10-26T10:00:00.000Z')
    expect(out).toMatch(/2026/)
    expect(out.length).toBeGreaterThan(8)
  })
})
