import { createClient } from '@libsql/client'

const url = process.env.TURSO_DB_URL ?? 'file:./levelup.db'
const authToken = process.env.TURSO_AUTH_TOKEN

const client = createClient({ url, authToken })

async function migrate() {
  console.log('[migrate] Removing streaks, adding reminder columns...')

  // Neutralize streak_days (leave column in place — SQLite can't easily drop columns)
  await client.execute('UPDATE user_state SET streak_days = 0 WHERE id = 1')

  // Add reminder columns (idempotent — ignore if already exist)
  try {
    await client.execute('ALTER TABLE user_state ADD COLUMN last_reminder_sent TEXT')
  } catch {
    console.log('[migrate] last_reminder_sent column already exists, skipping')
  }

  try {
    await client.execute('ALTER TABLE user_state ADD COLUMN reminder_level INTEGER NOT NULL DEFAULT 0')
  } catch {
    console.log('[migrate] reminder_level column already exists, skipping')
  }

  console.log('[migrate] Done.')
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err)
  process.exit(1)
})
