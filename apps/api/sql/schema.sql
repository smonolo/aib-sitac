CREATE SCHEMA IF NOT EXISTS aib_sitac;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS aib_sitac.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  center_lng DOUBLE PRECISION NOT NULL DEFAULT 9.19,
  center_lat DOUBLE PRECISION NOT NULL DEFAULT 45.46,
  zoom DOUBLE PRECISION NOT NULL DEFAULT 12,
  passphrase_hash TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS aib_sitac.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES aib_sitac.incidents(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_label TEXT,
  op TEXT NOT NULL CHECK (op IN ('upsert_feature', 'delete_feature', 'named_snapshot', 'set_view')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_incident_ts_idx ON aib_sitac.events (incident_id, ts);
