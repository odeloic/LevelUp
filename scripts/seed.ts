/**
 * Initializes levelup.db from roadmap.sql if not already seeded.
 *
 * Safe to re-run: uses CREATE TABLE IF NOT EXISTS and INSERT OR IGNORE,
 * so it will never overwrite existing data.
 *
 * Usage: npx tsx scripts/seed.ts
 */

import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const DB_PATH  = resolve(process.cwd(), 'levelup.db')
const SQL_PATH = resolve(process.cwd(), 'roadmap.sql')

if (!existsSync(SQL_PATH)) {
  console.error(`[seed] roadmap.sql not found at ${SQL_PATH}`)
  process.exit(1)
}

const db = new Database(DB_PATH)
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

// Check if already seeded (tracks table exists and has rows)
const alreadySeeded = db
  .prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='tracks'`)
  .get() as { count: number }

if (alreadySeeded.count > 0) {
  const trackCount = db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number }
  if (trackCount.count > 0) {
    console.log(`[seed] DB already seeded (${trackCount.count} tracks found). Nothing to do.`)
    db.close()
    process.exit(0)
  }
}

console.log(`[seed] Initializing ${DB_PATH} from roadmap.sql...`)

const sql = readFileSync(SQL_PATH, 'utf-8')

// db.exec() runs the full SQL file as-is — no manual statement splitting needed.
db.exec(sql)

console.log(`[seed] Done.`)
db.close()
