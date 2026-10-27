import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type DrizzleDb = NodePgDatabase<typeof schema>

let pool: Pool | null = null
let db: DrizzleDb | null = null
let schemaReady: Promise<void> | null = null

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is required')
    }
    const max = Number(process.env.DB_POOL_MAX ?? 20)
    pool = new Pool({
      connectionString: url,
      max: Number.isFinite(max) && max > 0 ? max : 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      options: '-c statement_timeout=15000',
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

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sqlPath = join(__dirname, '..', '..', 'sql', 'schema.sql')
      const sql = readFileSync(sqlPath, 'utf8')
      await getPool().query(sql)
    })()
  }
  await schemaReady
}

export * from './schema'
