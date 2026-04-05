import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  dbCredentials: {
    url: './levelup.db',
  },
  schema: './server/db/migrations/schema.ts',
  out:    './server/db/migrations',
})
