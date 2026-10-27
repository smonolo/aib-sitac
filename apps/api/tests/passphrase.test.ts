import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { hashPassphrase, verifyPassphrase } from '../src/common/security'

describe('passphrase', () => {
  test('hash roundtrip', async () => {
    const hash = await hashPassphrase('segreto-123')
    assert.match(hash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
    assert.equal(await verifyPassphrase('segreto-123', hash), true)
    assert.equal(await verifyPassphrase('wrong', hash), false)
  })

  test('distinct salts per hash', async () => {
    const a = await hashPassphrase('same')
    const b = await hashPassphrase('same')
    assert.notEqual(a, b)
    assert.equal(await verifyPassphrase('same', a), true)
    assert.equal(await verifyPassphrase('same', b), true)
  })

  test('rejects malformed stored values', async () => {
    assert.equal(await verifyPassphrase('x', ''), false)
    assert.equal(await verifyPassphrase('x', 'not-a-hash'), false)
    assert.equal(await verifyPassphrase('x', 'bcrypt$salt$hash'), false)
    assert.equal(await verifyPassphrase('x', 'scrypt$onlytwo'), false)
    assert.equal(await verifyPassphrase('x', 'scrypt$$'), false)
  })
})
