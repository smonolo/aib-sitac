import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  MAX_EVENT_PAYLOAD_BYTES,
  appendEventSchema,
  assertPayloadSize,
  uuidParamSchema,
} from '../src/common/validation'

describe('uuidParamSchema', () => {
  test('accepts uuid', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    assert.equal(uuidParamSchema.parse(id), id)
  })

  test('rejects non-uuid', () => {
    assert.equal(uuidParamSchema.safeParse('not-a-uuid').success, false)
    assert.equal(uuidParamSchema.safeParse('').success, false)
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
    assert.equal(parsed.success, true)
  })

  test('accepts delete_feature', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'delete_feature',
      payload: { featureId },
    })
    assert.equal(parsed.success, true)
  })

  test('rejects legacy named_snapshot writes', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'named_snapshot',
      payload: { name: 'x' },
    })
    assert.equal(parsed.success, false)
  })

  test('rejects client-controlled ts field', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'delete_feature',
      payload: { featureId },
      ts: '2020-01-01T00:00:00.000Z',
    })
    assert.equal(parsed.success, false)
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
    assert.equal(parsed.success, false)
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
    assert.equal(parsed.success, false)
  })

  test('rejects extra payload keys', () => {
    const parsed = appendEventSchema.safeParse({
      op: 'delete_feature',
      payload: { featureId, extra: true },
    })
    assert.equal(parsed.success, false)
  })
})

describe('assertPayloadSize', () => {
  test('allows normal payloads', () => {
    assert.doesNotThrow(() =>
      assertPayloadSize({ featureId: 'x', geometry: { type: 'Point' } })
    )
  })

  test('rejects oversized payloads', () => {
    const huge = { blob: 'x'.repeat(MAX_EVENT_PAYLOAD_BYTES) }
    assert.throws(() => assertPayloadSize(huge))
  })
})
