import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { DEFAULT_CENTER, type SitacEventPayload } from '@aib-sitac/core'

export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  centerLng: doublePrecision('center_lng')
    .notNull()
    .default(DEFAULT_CENTER.lng),
  centerLat: doublePrecision('center_lat')
    .notNull()
    .default(DEFAULT_CENTER.lat),
  zoom: doublePrecision('zoom').notNull().default(DEFAULT_CENTER.zoom),
  passphraseHash: text('passphrase_hash'),
  schemaVersion: integer('schema_version').notNull().default(1),
})

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
    actorLabel: text('actor_label'),
    op: text('op').notNull(),
    payload: jsonb('payload').$type<SitacEventPayload>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [index('events_incident_ts_idx').on(table.incidentId, table.ts)]
)

export type IncidentRow = typeof incidents.$inferSelect
export type EventRow = typeof events.$inferSelect
