import { ConnectionTracker, RateLimiter } from '../src/common/security'

describe('RateLimiter', () => {
  test('allows up to limit then blocks', () => {
    const limiter = new RateLimiter(3, 60_000)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(false)
    expect(limiter.check('b')).toBe(true)
  })

  test('window expiry frees the bucket', async () => {
    const limiter = new RateLimiter(1, 30)
    expect(limiter.check('k')).toBe(true)
    expect(limiter.check('k')).toBe(false)
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(limiter.check('k')).toBe(true)
  })
})

describe('ConnectionTracker', () => {
  test('caps concurrent acquisitions per key', () => {
    const tracker = new ConnectionTracker(2)
    expect(tracker.tryAcquire('r1')).toBe(true)
    expect(tracker.tryAcquire('r1')).toBe(true)
    expect(tracker.tryAcquire('r1')).toBe(false)
    tracker.release('r1')
    expect(tracker.tryAcquire('r1')).toBe(true)
    tracker.release('r1')
    tracker.release('r1')
    tracker.release('r1')
    expect(tracker.tryAcquire('r1')).toBe(true)
  })

  test('release on unknown key is a no-op', () => {
    const tracker = new ConnectionTracker(1)
    tracker.release('missing')
    expect(tracker.tryAcquire('missing')).toBe(true)
  })

  test('keys are isolated', () => {
    const tracker = new ConnectionTracker(1)
    expect(tracker.tryAcquire('a')).toBe(true)
    expect(tracker.tryAcquire('b')).toBe(true)
    expect(tracker.tryAcquire('a')).toBe(false)
  })
})
