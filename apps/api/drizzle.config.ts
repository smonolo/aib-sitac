import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

loadEnv({ path: resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './.drizzle',
  dialect: 'postgresql',
  schemaFilter: ['aib_sitac'],
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
})
