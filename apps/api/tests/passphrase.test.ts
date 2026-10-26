import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hashPassphrase, verifyPassphrase } from '../src/common/security'

test('passphrase hash roundtrip', () => {
  const hash = hashPassphrase('segreto-123')
  assert.equal(verifyPassphrase('segreto-123', hash), true)
  assert.equal(verifyPassphrase('wrong', hash), false)
})
