import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  markScrubIndex,
  readTimelineStepParam,
  roomUrlWithTimelineStep,
} from './timeline-url'

describe('timeline-url', () => {
  it('reads 1-based step from search', () => {
    assert.equal(readTimelineStepParam('?step=3'), 3)
    assert.equal(readTimelineStepParam('step=1'), 1)
    assert.equal(readTimelineStepParam('?foo=1'), null)
    assert.equal(readTimelineStepParam('?step=0'), null)
    assert.equal(readTimelineStepParam('?step=-2'), null)
    assert.equal(readTimelineStepParam('?step=nope'), null)
    assert.equal(readTimelineStepParam(''), null)
  })

  it('builds room URLs with or without step', () => {
    const base = 'https://example.test/i/abc?x=1'
    assert.equal(
      roomUrlWithTimelineStep(base, 4),
      'https://example.test/i/abc?x=1&step=4'
    )
    assert.equal(
      roomUrlWithTimelineStep('https://example.test/i/abc?step=2&x=1', null),
      'https://example.test/i/abc?x=1'
    )
    assert.equal(
      roomUrlWithTimelineStep('https://example.test/i/abc?step=2', 7),
      'https://example.test/i/abc?step=7'
    )
  })

  it('resolves scrub index from mark timestamps', () => {
    const marks = [
      { ts: '2026-01-01T10:00:00.000Z' },
      { ts: '2026-01-01T11:00:00.000Z' },
      { ts: '2026-01-01T12:00:00.000Z' },
    ]
    assert.equal(markScrubIndex([], null), 0)
    assert.equal(markScrubIndex(marks, null), 2)
    assert.equal(markScrubIndex(marks, '2026-01-01T10:00:00.000Z'), 0)
    assert.equal(markScrubIndex(marks, '2026-01-01T10:30:00.000Z'), 0)
    assert.equal(markScrubIndex(marks, '2026-01-01T11:00:00.000Z'), 1)
    assert.equal(markScrubIndex(marks, '2026-01-01T12:00:00.000Z'), 2)
    assert.equal(markScrubIndex(marks, '2026-01-01T13:00:00.000Z'), 2)
  })
})
