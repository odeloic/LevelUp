import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './migrations/schema'

const client = createClient({
  url: process.env.TURSO_DB_URL ?? 'file:./levelup.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
