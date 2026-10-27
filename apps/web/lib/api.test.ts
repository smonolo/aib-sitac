import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ApiError, eventsStreamUrl, isPassphraseError } from './api'

describe('eventsStreamUrl', () => {
  test('points at Nest SSE route', () => {
    const url = eventsStreamUrl('abc-123')
    assert.match(url, /\/api\/incidents\/abc-123\/events\/stream$/)
  })
})

describe('ApiError / isPassphraseError', () => {
  test('ApiError carries status', () => {
    const err = new ApiError('Password required', 401)
    assert.equal(err.name, 'ApiError')
    assert.equal(err.message, 'Password required')
    assert.equal(err.status, 401)
    assert.ok(err instanceof Error)
  })

  test('isPassphraseError true for 401 and 403 ApiError', () => {
    assert.equal(isPassphraseError(new ApiError('x', 401)), true)
    assert.equal(isPassphraseError(new ApiError('x', 403)), true)
  })

  test('isPassphraseError false otherwise', () => {
    assert.equal(isPassphraseError(new ApiError('boom', 500)), false)
    assert.equal(isPassphraseError(new ApiError('gone', 404)), false)
    assert.equal(isPassphraseError(new Error('unauthorized')), false)
    assert.equal(isPassphraseError('password'), false)
    assert.equal(isPassphraseError(null), false)
  })
})
