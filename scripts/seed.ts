/**
 * Initializes the DB from roadmap.sql if not already seeded.
 * Works with both local file (dev) and remote Turso (prod).
 *
 * Usage: npx tsx scripts/seed.ts
 */

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const SQL_PATH = resolve(process.cwd(), 'roadmap.sql')

if (!existsSync(SQL_PATH)) {
  console.error(`[seed] roadmap.sql not found at ${SQL_PATH}`)
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DB_URL ?? 'file:./levelup.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client)

// Check if already seeded
const result = await client.execute(
  `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='tracks'`
)
const tableExists = Number(result.rows[0].count) > 0

if (tableExists) {
  const rows = await client.execute('SELECT COUNT(*) as count FROM tracks')
  const trackCount = Number(rows.rows[0].count)
  if (trackCount > 0) {
    console.log(`[seed] Already seeded (${trackCount} tracks). Nothing to do.`)
    client.close()
    process.exit(0)
  }
}

console.log(`[seed] Seeding from roadmap.sql...`)

const sql = readFileSync(SQL_PATH, 'utf-8')
  .split('\n')
  .filter(line => !line.trimStart().toUpperCase().startsWith('PRAGMA'))
  .join('\n')

await client.executeMultiple(sql)

console.log(`[seed] Done.`)
client.close()
