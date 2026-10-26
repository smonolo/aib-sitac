import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eventsStreamUrl } from './api'

test('eventsStreamUrl points at Nest SSE route', () => {
  const url = eventsStreamUrl('abc-123')
  assert.match(url, /\/api\/incidents\/abc-123\/events\/stream$/)
})
