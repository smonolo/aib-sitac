import { hashPassphrase, verifyPassphrase } from '../src/common/security'

describe('passphrase', () => {
  test('hash roundtrip', async () => {
    const hash = await hashPassphrase('segreto-123')
    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
    expect(await verifyPassphrase('segreto-123', hash)).toBe(true)
    expect(await verifyPassphrase('wrong', hash)).toBe(false)
  })

  test('distinct salts per hash', async () => {
    const a = await hashPassphrase('same')
    const b = await hashPassphrase('same')
    expect(a).not.toBe(b)
    expect(await verifyPassphrase('same', a)).toBe(true)
    expect(await verifyPassphrase('same', b)).toBe(true)
  })

  test('rejects malformed stored values', async () => {
    expect(await verifyPassphrase('x', '')).toBe(false)
    expect(await verifyPassphrase('x', 'not-a-hash')).toBe(false)
    expect(await verifyPassphrase('x', 'bcrypt$salt$hash')).toBe(false)
    expect(await verifyPassphrase('x', 'scrypt$onlytwo')).toBe(false)
    expect(await verifyPassphrase('x', 'scrypt$$')).toBe(false)
  })
})
