import { eq } from 'drizzle-orm'
import { db } from '../index'
import { userState } from '../migrations/schema'
import { AppError, ErrorCode } from '../../utils/errors'
import type { UpdateUserStateBody } from '../../schemas/user'

const INITIAL_USER_STATE = {
  id:             1,
  currentWeek:    1,
  startedAt:      new Date().toISOString().slice(0, 10),
  streakDays:     0,
  lastActiveDate: null,
  xp:             0,
} as const

export function nextStreak(currentStreak: number, lastActiveDate: string | null): number {
  const today = new Date().toISOString().slice(0, 10)
  if (lastActiveDate === today) return currentStreak
  if (lastActiveDate === null) return 1
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  return lastActiveDate === yesterday ? currentStreak + 1 : 1
}

export async function getUserState() {
  await db.insert(userState).values(INITIAL_USER_STATE).onConflictDoNothing()

  const row = await db.select().from(userState).where(eq(userState.id, 1)).get()

  if (!row) {
    throw new AppError(ErrorCode.USER_STATE_MISSING, 'User state could not be initialized', 500)
  }

  // Auto-compute current week from startedAt (source of truth)
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(row.startedAt).getTime()) / 86_400_000,
  )
  const currentWeek = Math.min(12, Math.max(1, Math.ceil((daysSinceStart + 1) / 7)))

  // Effective streak: show 0 if last activity was more than 1 day ago
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  const effectiveStreak = (row.lastActiveDate === today || row.lastActiveDate === yesterday)
    ? row.streakDays
    : 0

  return { ...row, currentWeek, effectiveStreak }
}

export async function updateUserState(patch: Partial<UpdateUserStateBody>) {
  await db.update(userState).set(patch).where(eq(userState.id, 1))
  return getUserState()
}
