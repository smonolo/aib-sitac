CREATE SCHEMA IF NOT EXISTS "aib_sitac";
--> statement-breakpoint
CREATE TABLE "aib_sitac"."incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"center_lng" double precision DEFAULT 9.19 NOT NULL,
	"center_lat" double precision DEFAULT 45.46 NOT NULL,
	"zoom" double precision DEFAULT 12 NOT NULL,
	"passphrase_hash" text,
	"schema_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aib_sitac"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_label" text,
	"op" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_op_check" CHECK ("aib_sitac"."events"."op" in ('upsert_feature', 'delete_feature', 'named_snapshot', 'set_view'))
);
--> statement-breakpoint
ALTER TABLE "aib_sitac"."events" ADD CONSTRAINT "events_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "aib_sitac"."incidents"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "events_incident_ts_idx" ON "aib_sitac"."events" USING btree ("incident_id","ts");
