import { z } from 'zod'
import { SYMBOL_IDS } from '@aib-sitac/core'

export const uuidParamSchema = z.string().uuid()

const lonLatSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
])

const MAX_LINE_COORDS = 256
const MAX_RING_COORDS = 256

const pointGeometry = z.object({
  type: z.literal('Point'),
  coordinates: lonLatSchema,
})

const lineGeometry = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(lonLatSchema).min(2).max(MAX_LINE_COORDS),
})

const polygonGeometry = z.object({
  type: z.literal('Polygon'),
  coordinates: z
    .array(z.array(lonLatSchema).min(4).max(MAX_RING_COORDS))
    .min(1)
    .max(1),
})

const geometrySchema = z.discriminatedUnion('type', [
  pointGeometry,
  lineGeometry,
  polygonGeometry,
])

const featurePropsSchema = z
  .object({
    symbolId: z.enum(SYMBOL_IDS),
    geometryKind: z.enum(['point', 'line', 'arrow', 'polygon', 'text']),
    label: z.string().max(200).optional(),
    note: z.string().max(2_000).optional(),
    estimated: z.boolean().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .strict()

const upsertPayloadSchema = z
  .object({
    featureId: z.string().uuid(),
    geometry: geometrySchema,
    properties: featurePropsSchema,
  })
  .strict()

const deletePayloadSchema = z
  .object({
    featureId: z.string().uuid(),
  })
  .strict()

export const appendEventSchema = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('upsert_feature'),
      payload: upsertPayloadSchema,
      actorLabel: z.string().max(100).optional().nullable(),
    })
    .strict(),
  z
    .object({
      op: z.literal('delete_feature'),
      payload: deletePayloadSchema,
      actorLabel: z.string().max(100).optional().nullable(),
    })
    .strict(),
])

export const MAX_EVENT_PAYLOAD_BYTES = 48_000
export const MAX_EVENTS_PER_ROOM = 15_000

export function assertPayloadSize(payload: unknown): void {
  const size = Buffer.byteLength(JSON.stringify(payload), 'utf8')
  if (size > MAX_EVENT_PAYLOAD_BYTES) {
    throw new Error('payload_too_large')
  }
}
