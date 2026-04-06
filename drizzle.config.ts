import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DB_URL ?? 'file:./levelup.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  schema: './server/db/migrations/schema.ts',
  out:    './server/db/migrations',
})
