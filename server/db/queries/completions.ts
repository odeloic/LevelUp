import { eq, and, or, isNotNull } from 'drizzle-orm'
import { db } from '../index'
import { completions, tasks } from '../migrations/schema'
import type { LogCompletionBody } from '../../schemas/completions'

export async function logCompletion(body: LogCompletionBody) {
  const [inserted] = await db
    .insert(completions)
    .values({
      taskId:      body.taskId,
      weekNumber:  body.weekNumber ?? null,
      dayDate:     body.dayDate ?? null,
      completedAt: new Date().toISOString(),
      prUrl:       body.prUrl ?? null,
      notes:       body.notes ?? null,
    })
    .returning()

  return inserted
}

export async function getEvidenceTrail(phaseId: number) {
  return db
    .select({
      completionId: completions.id,
      taskId:       completions.taskId,
      taskTitle:    tasks.title,
      completedAt:  completions.completedAt,
      prUrl:        completions.prUrl,
      notes:        completions.notes,
      weekNumber:   completions.weekNumber,
    })
    .from(completions)
    .innerJoin(tasks, eq(completions.taskId, tasks.id))
    .where(
      and(
        eq(tasks.phaseId, phaseId),
        eq(tasks.isDeliverable, 1),
        or(isNotNull(completions.prUrl), isNotNull(completions.notes)),
      ),
    )
    .orderBy(completions.completedAt)
}
