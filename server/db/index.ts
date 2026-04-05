import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './migrations/schema'
import { resolve } from 'path'

const DB_PATH = resolve(process.cwd(), 'levelup.db')

const sqlite = new Database(DB_PATH)
sqlite.pragma('foreign_keys = ON')
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })
export { sqlite }
