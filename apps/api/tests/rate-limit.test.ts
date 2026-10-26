import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RateLimiter } from '../src/common/security'

test('RateLimiter allows up to limit then blocks', () => {
  const limiter = new RateLimiter(3, 60_000)
  assert.equal(limiter.check('a'), true)
  assert.equal(limiter.check('a'), true)
  assert.equal(limiter.check('a'), true)
  assert.equal(limiter.check('a'), false)
  assert.equal(limiter.check('b'), true)
})
