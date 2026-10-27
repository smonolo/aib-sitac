import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ConnectionTracker, RateLimiter } from '../src/common/security'

describe('RateLimiter', () => {
  test('allows up to limit then blocks', () => {
    const limiter = new RateLimiter(3, 60_000)
    assert.equal(limiter.check('a'), true)
    assert.equal(limiter.check('a'), true)
    assert.equal(limiter.check('a'), true)
    assert.equal(limiter.check('a'), false)
    assert.equal(limiter.check('b'), true)
  })

  test('window expiry frees the bucket', async () => {
    const limiter = new RateLimiter(1, 30)
    assert.equal(limiter.check('k'), true)
    assert.equal(limiter.check('k'), false)
    await new Promise(resolve => setTimeout(resolve, 40))
    assert.equal(limiter.check('k'), true)
  })
})

describe('ConnectionTracker', () => {
  test('caps concurrent acquisitions per key', () => {
    const tracker = new ConnectionTracker(2)
    assert.equal(tracker.tryAcquire('r1'), true)
    assert.equal(tracker.tryAcquire('r1'), true)
    assert.equal(tracker.tryAcquire('r1'), false)
    tracker.release('r1')
    assert.equal(tracker.tryAcquire('r1'), true)
    tracker.release('r1')
    tracker.release('r1')
    tracker.release('r1')
    assert.equal(tracker.tryAcquire('r1'), true)
  })
})
