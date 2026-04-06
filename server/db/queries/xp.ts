import { desc } from 'drizzle-orm'
import { db } from '../index'
import { xpEvents } from '../migrations/schema'

export const XP_VALUES = {
  daily:         5,
  weekly:        15,
  end_of_phase:  50,
  phase_unlock:  100,
  streak_7_days: 75,
} as const

export function calcCompletionXp(
  cadence: 'daily' | 'weekly' | 'end_of_phase',
  isDeliverable: number,
): number {
  if (cadence === 'end_of_phase') return XP_VALUES.end_of_phase
  return XP_VALUES[cadence] + (isDeliverable === 1 ? XP_VALUES.end_of_phase : 0)
}

export function calcStreakBonus(streakDays: number): number {
  return streakDays > 0 && streakDays % 7 === 0 ? XP_VALUES.streak_7_days : 0
}

export async function logXpEvent(event: {
  eventType: 'daily' | 'weekly' | 'end_of_phase' | 'deliverable' | 'phase_unlock' | 'streak_7_days'
  amount: number
  taskId?: number | null
  phaseId?: number | null
}) {
  await db.insert(xpEvents).values({
    eventType:  event.eventType,
    amount:     event.amount,
    taskId:     event.taskId ?? null,
    phaseId:    event.phaseId ?? null,
    occurredAt: new Date().toISOString(),
  })
}

export async function getXpHistory(limit = 50) {
  return db.select().from(xpEvents).orderBy(desc(xpEvents.occurredAt)).limit(limit)
}
