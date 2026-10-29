import {
  markScrubIndex,
  readTimelineStepParam,
  roomUrlWithTimelineStep,
} from './timeline-url'

describe('timeline-url', () => {
  it('reads 1-based step from search', () => {
    expect(readTimelineStepParam('?step=3')).toBe(3)
    expect(readTimelineStepParam('step=1')).toBe(1)
    expect(readTimelineStepParam('?foo=1')).toBe(null)
    expect(readTimelineStepParam('?step=0')).toBe(null)
    expect(readTimelineStepParam('?step=-2')).toBe(null)
    expect(readTimelineStepParam('?step=nope')).toBe(null)
    expect(readTimelineStepParam('')).toBe(null)
  })

  it('builds room URLs with or without step', () => {
    const base = 'https://example.test/i/abc?x=1'
    expect(roomUrlWithTimelineStep(base, 4)).toBe(
      'https://example.test/i/abc?x=1&step=4'
    )
    expect(
      roomUrlWithTimelineStep('https://example.test/i/abc?step=2&x=1', null)
    ).toBe('https://example.test/i/abc?x=1')
    expect(
      roomUrlWithTimelineStep('https://example.test/i/abc?step=2', 7)
    ).toBe('https://example.test/i/abc?step=7')
  })

  it('resolves scrub index from mark timestamps', () => {
    const marks = [
      { ts: '2026-01-01T10:00:00.000Z' },
      { ts: '2026-01-01T11:00:00.000Z' },
      { ts: '2026-01-01T12:00:00.000Z' },
    ]
    expect(markScrubIndex([], null)).toBe(0)
    expect(markScrubIndex(marks, null)).toBe(2)
    expect(markScrubIndex(marks, '2026-01-01T10:00:00.000Z')).toBe(0)
    expect(markScrubIndex(marks, '2026-01-01T10:30:00.000Z')).toBe(0)
    expect(markScrubIndex(marks, '2026-01-01T11:00:00.000Z')).toBe(1)
    expect(markScrubIndex(marks, '2026-01-01T12:00:00.000Z')).toBe(2)
    expect(markScrubIndex(marks, '2026-01-01T13:00:00.000Z')).toBe(2)
  })
})
