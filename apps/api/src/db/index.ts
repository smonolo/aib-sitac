import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from './schema'

export type DrizzleDb = NodePgDatabase<typeof schema>

const MIGRATIONS_SCHEMA = 'aib_sitac'
const MIGRATIONS_TABLE = '__drizzle_migrations'

let pool: Pool | null = null
let db: DrizzleDb | null = null
let schemaReady: Promise<void> | null = null

function migrationsFolder(): string {
  return join(__dirname, '..', '..', 'drizzle')
}

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is required')
    }
    pool = new Pool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      options: '-c search_path=aib_sitac,public -c statement_timeout=15000',
    })
  }
  return pool
}

export function getDb(): DrizzleDb {
  if (!db) {
    db = drizzle(getPool(), { schema })
  }
  return db
}

async function baselineExistingSchema(): Promise<void> {
  const client = getPool()
  const existing = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = 'incidents'
     ) AS exists`,
    [MIGRATIONS_SCHEMA]
  )
  if (!existing.rows[0]?.exists) return

  await client.query(`CREATE SCHEMA IF NOT EXISTS "${MIGRATIONS_SCHEMA}"`)
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)

  const applied = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"`
  )
  if (Number(applied.rows[0]?.count) > 0) return

  const journal = JSON.parse(
    readFileSync(join(migrationsFolder(), 'meta/_journal.json'), 'utf8')
  ) as { entries: { tag: string; when: number }[] }
  const first = journal.entries[0]
  if (!first) return

  const sqlText = readFileSync(
    join(migrationsFolder(), `${first.tag}.sql`),
    'utf8'
  )
  const hash = createHash('sha256').update(sqlText).digest('hex')
  await client.query(
    `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ("hash", "created_at")
     VALUES ($1, $2)`,
    [hash, first.when]
  )
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await baselineExistingSchema()
      await migrate(getDb(), {
        migrationsFolder: migrationsFolder(),
        migrationsSchema: MIGRATIONS_SCHEMA,
        migrationsTable: MIGRATIONS_TABLE,
      })
    })()
  }
  await schemaReady
}

export * from './schema'
