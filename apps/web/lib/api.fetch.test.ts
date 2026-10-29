import {
  ApiError,
  appendEvent,
  createIncident,
  eventsStreamUrl,
  getIncident,
  getIncidentGate,
  listEvents,
  listIncidents,
  updateIncident,
} from './api'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? 'Unauthorized' : 'Error',
    json: async () => body,
  } as Response
}

describe('api fetch client', () => {
  const fetchMock = jest.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  test('createIncident posts JSON body', async () => {
    const incident = { id: '1', title: 'Bosco' }
    fetchMock.mockResolvedValue(jsonResponse(incident))
    await expect(
      createIncident({ title: 'Bosco', passphrase: 'secret' })
    ).resolves.toEqual(incident)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/incidents$/),
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
      })
    )
    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(JSON.parse(String(init.body))).toEqual({
      title: 'Bosco',
      passphrase: 'secret',
    })
  })

  test('listIncidents builds query string', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], page: 1, pageSize: 20, total: 0 })
    )
    await listIncidents({ q: ' bosco ', page: 2, pageSize: 10 })
    expect(fetchMock.mock.calls[0]![0]).toMatch(
      /\/api\/incidents\?q=bosco&page=2&pageSize=10$/
    )
  })

  test('getIncidentGate and getIncident hit expected routes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ hasPassphrase: true }))
      .mockResolvedValueOnce(jsonResponse({ id: '1' }))
    await expect(getIncidentGate('abc')).resolves.toEqual({
      hasPassphrase: true,
    })
    await getIncident('abc', 'pw')
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/api\/incidents\/abc\/gate$/)
    expect(fetchMock.mock.calls[1]![0]).toMatch(/\/api\/incidents\/abc$/)
    const headers = (fetchMock.mock.calls[1]![1] as RequestInit)
      .headers as Record<string, string>
    expect(headers['X-Passphrase']).toBe('pw')
  })

  test('updateIncident sends PATCH with passphrase header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: '1', title: 'Nuovo' }))
    await updateIncident('abc', { title: 'Nuovo' }, 'pw')
    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect((init.headers as Record<string, string>)['X-Passphrase']).toBe('pw')
  })

  test('listEvents and appendEvent use events routes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'e1' }))
    await listEvents('abc', null)
    await appendEvent(
      'abc',
      {
        op: 'delete_feature',
        payload: { featureId: '550e8400-e29b-41d4-a716-446655440000' },
        actorLabel: 'Sala',
      },
      'pw'
    )
    expect(fetchMock.mock.calls[0]![0]).toMatch(
      /\/api\/incidents\/abc\/events$/
    )
    expect(fetchMock.mock.calls[1]![1]).toEqual(
      expect.objectContaining({ method: 'POST' })
    )
  })

  test('eventsStreamUrl stays on Nest SSE path', () => {
    expect(eventsStreamUrl('abc')).toMatch(
      /\/api\/incidents\/abc\/events\/stream$/
    )
  })

  test('parseJson throws ApiError with message from body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Password required' }, 401)
    )
    await expect(getIncident('abc', 'x')).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        status: 401,
        message: 'Password required',
      })
    )
  })

  test('parseJson joins array message bodies', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: ['first', 'second'] }, 400)
    )
    await expect(getIncidentGate('abc')).rejects.toBeInstanceOf(ApiError)
    await expect(getIncidentGate('abc')).rejects.toThrow('first')
  })

  test('omits X-Passphrase when passphrase is null', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: '1' }))
    await getIncident('abc', null)
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit)
      .headers as Record<string, string>
    expect(headers['X-Passphrase']).toBeUndefined()
  })
})
