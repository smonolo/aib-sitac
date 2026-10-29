import { ApiError, eventsStreamUrl, isPassphraseError } from './api'

describe('eventsStreamUrl', () => {
  test('points at Nest SSE route', () => {
    const url = eventsStreamUrl('abc-123')
    expect(url).toMatch(/\/api\/incidents\/abc-123\/events\/stream$/)
  })
})

describe('ApiError / isPassphraseError', () => {
  test('ApiError carries status', () => {
    const err = new ApiError('Password required', 401)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('Password required')
    expect(err.status).toBe(401)
    expect(err instanceof Error).toBeTruthy()
  })

  test('isPassphraseError true for 401 and 403 ApiError', () => {
    expect(isPassphraseError(new ApiError('x', 401))).toBe(true)
    expect(isPassphraseError(new ApiError('x', 403))).toBe(true)
  })

  test('isPassphraseError false otherwise', () => {
    expect(isPassphraseError(new ApiError('boom', 500))).toBe(false)
    expect(isPassphraseError(new ApiError('gone', 404))).toBe(false)
    expect(isPassphraseError(new Error('unauthorized'))).toBe(false)
    expect(isPassphraseError('password')).toBe(false)
    expect(isPassphraseError(null)).toBe(false)
  })
})
