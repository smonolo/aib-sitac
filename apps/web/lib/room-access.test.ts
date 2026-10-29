import { DEFAULT_CENTER } from '@aib-sitac/core'
import { ApiError } from './api'
import {
  classifyUnlockError,
  lockedIncidentStub,
  resolveRoomGate,
  unlockErrorMessage,
} from './room-access'

const openIncident = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Bosco',
  createdAt: '2026-10-01T10:00:00.000Z',
  createdBy: 'Sala',
  centerLng: 9.2,
  centerLat: 45.5,
  zoom: 12,
  hasPassphrase: false,
  schemaVersion: 1,
}

describe('lockedIncidentStub', () => {
  test('builds a locked placeholder with default map view', () => {
    const stub = lockedIncidentStub('abc', 'Intervento protetto')
    expect(stub.id).toBe('abc')
    expect(stub.title).toBe('Intervento protetto')
    expect(stub.hasPassphrase).toBe(true)
    expect(stub.centerLng).toBe(DEFAULT_CENTER.lng)
    expect(stub.centerLat).toBe(DEFAULT_CENTER.lat)
    expect(stub.zoom).toBe(DEFAULT_CENTER.zoom)
    expect(stub.createdBy).toBe(null)
  })
})

describe('classifyUnlockError', () => {
  test('maps 401/403 to wrong passphrase', () => {
    expect(classifyUnlockError(new ApiError('nope', 401))).toEqual({
      kind: 'wrong_passphrase',
    })
    expect(classifyUnlockError(new ApiError('nope', 403))).toEqual({
      kind: 'wrong_passphrase',
    })
  })

  test('maps other errors to message', () => {
    expect(classifyUnlockError(new Error('boom'))).toEqual({
      kind: 'other',
      message: 'Error: boom',
    })
    expect(classifyUnlockError(new ApiError('down', 500))).toEqual({
      kind: 'other',
      message: 'ApiError: down',
    })
  })
})

describe('unlockErrorMessage', () => {
  test('uses Italian wrong-password copy for passphrase failures', () => {
    expect(
      unlockErrorMessage(
        { kind: 'wrong_passphrase' },
        { passphraseWrong: 'Password non corretta.' }
      )
    ).toBe('Password non corretta.')
    expect(
      unlockErrorMessage(
        { kind: 'other', message: 'network' },
        { passphraseWrong: 'Password non corretta.' }
      )
    ).toBe('network')
  })
})

describe('resolveRoomGate', () => {
  test('open room loads without passphrase', async () => {
    const loadIncident = jest.fn().mockResolvedValue(openIncident)
    await expect(
      resolveRoomGate({
        hasPassphrase: false,
        storedPassphrase: null,
        loadIncident,
      })
    ).resolves.toEqual({
      status: 'open',
      incident: openIncident,
      passphrase: null,
    })
    expect(loadIncident).toHaveBeenCalledWith(null)
  })

  test('protected room without stored passphrase stays locked', async () => {
    const loadIncident = jest.fn()
    await expect(
      resolveRoomGate({
        hasPassphrase: true,
        storedPassphrase: null,
        loadIncident,
      })
    ).resolves.toEqual({ status: 'locked' })
    expect(loadIncident).not.toHaveBeenCalled()
  })

  test('protected room unlocks with stored passphrase', async () => {
    const protectedIncident = { ...openIncident, hasPassphrase: true }
    const loadIncident = jest.fn().mockResolvedValue(protectedIncident)
    await expect(
      resolveRoomGate({
        hasPassphrase: true,
        storedPassphrase: 'segreto',
        loadIncident,
      })
    ).resolves.toEqual({
      status: 'open',
      incident: protectedIncident,
      passphrase: 'segreto',
    })
    expect(loadIncident).toHaveBeenCalledWith('segreto')
  })

  test('stale stored passphrase returns locked', async () => {
    const loadIncident = jest
      .fn()
      .mockRejectedValue(new ApiError('Password required', 401))
    await expect(
      resolveRoomGate({
        hasPassphrase: true,
        storedPassphrase: 'old',
        loadIncident,
      })
    ).resolves.toEqual({ status: 'locked' })
  })

  test('non-auth load failure returns error', async () => {
    const loadIncident = jest.fn().mockRejectedValue(new Error('offline'))
    await expect(
      resolveRoomGate({
        hasPassphrase: true,
        storedPassphrase: 'segreto',
        loadIncident,
      })
    ).resolves.toEqual({ status: 'error', message: 'Error: offline' })
  })

  test('open room load failure returns error', async () => {
    const loadIncident = jest.fn().mockRejectedValue(new Error('gone'))
    await expect(
      resolveRoomGate({
        hasPassphrase: false,
        storedPassphrase: null,
        loadIncident,
      })
    ).resolves.toEqual({ status: 'error', message: 'Error: gone' })
  })
})
