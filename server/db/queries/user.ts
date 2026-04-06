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

  return row
}

export async function updateUserState(patch: Partial<UpdateUserStateBody>) {
  await db.update(userState).set(patch).where(eq(userState.id, 1))
  return getUserState()
}
