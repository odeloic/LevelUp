# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal career roadmap tracker with gamification (XP, streaks, phase unlocks). Nuxt 4 + Drizzle ORM + Turso (libsql/SQLite).

## Commands

```bash
npm run dev            # Nuxt dev server (hot reload)
npm run build          # Production build
npm run preview        # Preview production build
npm run db:seed        # Initialize DB from roadmap.sql (idempotent)
npm run db:migrate     # Run migration scripts (e.g., add-xp-events)
npm run db:introspect  # Regenerate server/db/migrations/schema.ts from DB
rm levelup.db && npm run db:seed   # Reset local DB
```

## Environment

```env
TURSO_DB_URL=libsql://...   # omit for local dev (falls back to file:./levelup.db)
TURSO_AUTH_TOKEN=...        # omit for local dev
```

## Architecture

**Frontend** (`app/`): Nuxt 4 directory layout with Vue 3 + Tailwind (class-based dark mode).

- **Pages**: `index.vue` (dashboard), `settings.vue`, `log.vue`, `tracks/[slug].vue`, `phases/[slug].vue`
- **Composables**: `useUserState` (reactive user fetch), `useDarkMode` (localStorage + system pref), `useCompletion` (POST completions), `useQuickLog` (keyboard shortcut `L` opens quick-log modal)
- **Components**: `TaskLogModal` (validates deliverables require PR URL), `PhaseUnlockToast` (celebration toast), `ProgressRing` (SVG circular progress)
- Data fetching uses `useFetch()` + `computed()` for reactivity

**Server** (`server/`): Nuxt Nitro (H3) API routes with Drizzle ORM.

- `server/schemas/` — Zod input schemas shared by routes + queries
- `server/utils/response.ts` — `ApiResponse<T>`, `success()`, `apiError()`
- `server/utils/errors.ts` — `ErrorCode`, `AppError`, `handleError()`
- `server/db/index.ts` — Drizzle client (libsql)
- `server/db/migrations/` — Auto-generated schema + relations (from `drizzle-kit introspect`)
- `server/db/queries/` — Query layer: `user.ts`, `tasks.ts`, `phases.ts`, `completions.ts`, `xp.ts`

**`roadmap.sql`** is the source of truth for schema + seed data.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/phases?all=true` | List phases (include locked with `?all=true`) |
| GET | `/api/phases/:id/tasks` | Tasks for a phase |
| POST | `/api/completions` | Log a task completion (also logs XP events) |
| GET | `/api/user/state` | Current user state (XP, streak, week) |
| PATCH | `/api/user/state` | Update user state (start date, etc.) |
| GET | `/api/xp-events` | XP history (default 50 entries) |
| GET | `/api/tasks/today` | Single pending daily task (for quick-log) |

All routes return `ApiResponse<T>`:
```ts
{ ok: true;  data: T }
{ ok: false; error: { code: string; message: string; details?: unknown } }
```

Error codes: `PHASE_NOT_FOUND`, `TASK_NOT_FOUND`, `PHASE_LOCKED`, `INVALID_BODY`, `INVALID_PARAMS`, `USER_STATE_MISSING`, `INTERNAL`

## Route Handler Pattern

```ts
export default defineEventHandler(async (event) => {
  try {
    const body = Schema.parse(await readBody(event))
    return success(await queryFn(...))
  } catch (err) {
    handleError(err)  // always re-throws as H3 error
  }
})
```

## DB Access Patterns

```ts
// Single row
const row = await db.select().from(table).where(eq(table.id, id)).get()

// Insert + return
const [inserted] = await db.insert(table).values({...}).returning()

// Upsert (user_state auto-create)
await db.insert(userState).values(INITIAL).onConflictDoNothing()

// IMPORTANT: Always pass explicit completedAt — the schema default is a broken string literal
completedAt: new Date().toISOString()
```

## Domain Logic

**Phase unlocks**: A phase unlocks when `unlock_requires_phase_id IS NULL` OR all `is_deliverable=1` tasks in the required parent phase have a completion with `pr_url IS NOT NULL OR notes IS NOT NULL`.

**XP values**: daily=+5, weekly=+15, deliverable/end_of_phase=+50, phase_unlock=+100, 7-day streak=+75. Deliverables add +50 bonus on top of cadence XP.

**Streaks**: `effectiveStreak` shows 0 if last activity was >1 day ago (prevents stale display). Streak bonus triggers every 7 consecutive days.
