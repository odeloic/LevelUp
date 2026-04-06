import { eq, and, or, isNotNull } from 'drizzle-orm'
import { db } from '../index'
import { phases, tasks, completions } from '../migrations/schema'
import { AppError, ErrorCode } from '../../utils/errors'

export async function getActivePhases() {
  return db.select().from(phases).orderBy(phases.sortOrder)
}

export async function getUnlockedPhases() {
  const all = await getActivePhases()
  const results = await Promise.all(
    all.map(async (phase) => {
      const unlocked = await isPhaseUnlocked(phase.id)
      return unlocked ? phase : null
    }),
  )
  return results.filter(Boolean)
}

export async function isPhaseUnlocked(phaseId: number): Promise<boolean> {
  const phase = await db.select().from(phases).where(eq(phases.id, phaseId)).get()

  if (!phase) {
    throw new AppError(ErrorCode.PHASE_NOT_FOUND, `Phase ${phaseId} not found`, 404)
  }

  if (phase.unlockRequiresPhaseId === null) return true

  const deliverableTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.phaseId, phase.unlockRequiresPhaseId), eq(tasks.isDeliverable, 1)))

  if (deliverableTasks.length === 0) return true

  const evidenceChecks = await Promise.all(
    deliverableTasks.map(async (task) => {
      const row = await db
        .select({ id: completions.id })
        .from(completions)
        .where(
          and(
            eq(completions.taskId, task.id),
            or(isNotNull(completions.prUrl), isNotNull(completions.notes)),
          ),
        )
        .get()
      return row !== undefined
    }),
  )

  return evidenceChecks.every(Boolean)
}

export async function getChildPhaseUnlockStates(phaseId: number) {
  const children = await db
    .select()
    .from(phases)
    .where(eq(phases.unlockRequiresPhaseId, phaseId))

  const states = await Promise.all(
    children.map(async (child) => ({
      phaseId: child.id,
      unlocked: await isPhaseUnlocked(child.id),
    })),
  )

  return states
}
