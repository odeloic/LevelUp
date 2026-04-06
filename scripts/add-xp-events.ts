/**
 * One-time migration: adds the xp_events table.
 * Safe to re-run (CREATE TABLE IF NOT EXISTS).
 */
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DB_URL ?? 'file:./levelup.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

await client.executeMultiple(`
CREATE TABLE IF NOT EXISTS xp_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type  TEXT    NOT NULL CHECK(event_type IN ('daily','weekly','end_of_phase','deliverable','phase_unlock','streak_7_days')),
  amount      INTEGER NOT NULL,
  task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  phase_id    INTEGER REFERENCES phases(id) ON DELETE SET NULL,
  occurred_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_xp_events_occurred ON xp_events(occurred_at);
`)

console.log('[migrate] xp_events table ready')
client.close()
