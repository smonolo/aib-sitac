import {
  MAX_EVENT_PAYLOAD_BYTES,
  appendEventSchema,
  assertPayloadSize,
  uuidParamSchema,
} from '../src/common/validation'

describe('uuidParamSchema', () => {
  test('accepts uuid', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    expect(uuidParamSchema.parse(id)).toBe(id)
  })

  test('rejects non-uuid', () => {
    expect(uuidParamSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidParamSchema.safeParse('').success).toBe(false)
  })
})

describe('appendEventSchema', () => {
  const featureId = '550e8400-e29b-41d4-a716-446655440000'

  test('accepts upsert_feature point', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'hotspot',
          geometryKind: 'point',
          color: '#AF2525',
        },
      },
      actorLabel: 'Sala',
    })
    expect(parsed.success).toBe(true)
  })

  test('accepts delete_feature', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'delete_feature',
      payload: { featureId },
    })
    expect(parsed.success).toBe(true)
  })

  test('accepts text mark upsert with label and note', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'Punto di raccolta',
          note: 'Punto di raccolta',
          color: '#111111',
        },
      },
      actorLabel: 'Sala',
    })
    expect(parsed.success).toBe(true)
  })

  test('accepts text mark edit upsert for the same featureId', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'Aggiornato',
          note: 'Aggiornato',
        },
      },
      actorLabel: 'Sala',
    })
    expect(parsed.success).toBe(true)
  })

  test('rejects overlong text label', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'x'.repeat(201),
        },
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('accepts label at max length 200', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'x'.repeat(200),
        },
      },
    })
    expect(parsed.success).toBe(true)
  })

  test('rejects overlong note field', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          note: 'n'.repeat(2001),
        },
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('accepts text mark without label or note', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
        },
      },
    })
    expect(parsed.success).toBe(true)
  })

  test('rejects invalid color on text mark', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'x',
          color: 'red',
        },
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('does not enforce symbolId/geometryKind pairing', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'hotspot',
          geometryKind: 'text',
          label: 'x',
        },
      },
    })
    expect(parsed.success).toBe(true)
  })

  test('does not require Point geometry for text marks', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: {
          type: 'LineString',
          coordinates: [
            [9.2, 45.5],
            [9.3, 45.6],
          ],
        },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'x',
        },
      },
    })
    expect(parsed.success).toBe(true)
  })

  test('rejects out-of-range point coordinates', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [200, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'x',
        },
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects actorLabel longer than max', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9.2, 45.5] },
        properties: {
          symbolId: 'note',
          geometryKind: 'text',
          label: 'x',
        },
      },
      actorLabel: 'a'.repeat(101),
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects legacy named_snapshot writes', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'named_snapshot',
      payload: { name: 'x' },
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects client-controlled ts field', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'delete_feature',
      payload: { featureId },
      ts: '2020-01-01T00:00:00.000Z',
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects unknown symbolId', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'Point', coordinates: [9, 45] },
        properties: { symbolId: 'nato_tank', geometryKind: 'point' },
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects overlong line', () => {
    const coords = Array.from({ length: 300 }, (_, i) => [9 + i * 0.0001, 45])
    const parsed = appendEventSchema.safeParse({
      op: 'upsert_feature',
      payload: {
        featureId,
        geometry: { type: 'LineString', coordinates: coords },
        properties: { symbolId: 'road_closed', geometryKind: 'line' },
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('rejects extra payload keys', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'delete_feature',
      payload: { featureId, extra: true },
    })
    expect(parsed.success).toBe(false)
  })
})

describe('assertPayloadSize', () => {
  test('allows normal payloads', () => {
    expect(() =>
      assertPayloadSize({ featureId: 'x', geometry: { type: 'Point' } })
    ).not.toThrow()
  })

  test('rejects oversized payloads', () => {
    const huge = { blob: 'x'.repeat(MAX_EVENT_PAYLOAD_BYTES) }
    expect(() => assertPayloadSize(huge)).toThrow()
  })
})
