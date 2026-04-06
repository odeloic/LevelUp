import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../db/index'
import { tasks, completions } from '../../db/migrations/schema'
import { getUnlockedPhases } from '../../db/queries/phases'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const unlockedPhases = await getUnlockedPhases()
    if (!unlockedPhases.length) return success(null)

    const phaseIds = unlockedPhases.map((p) => p.id)

    // Fetch all daily tasks and today's completions in parallel
    const [allDailyTasks, todayCompletions] = await Promise.all([
      db.select().from(tasks)
        .where(and(inArray(tasks.phaseId, phaseIds), eq(tasks.cadence, 'daily')))
        .orderBy(tasks.phaseId, tasks.sortOrder),
      db.select({ taskId: completions.taskId }).from(completions)
        .where(eq(completions.dayDate, today)),
    ])

    const completedIds = new Set(todayCompletions.map((c) => c.taskId))

    // Find first pending task, respecting phase order
    const phaseOrder = new Map(unlockedPhases.map((p, i) => [p.id, i]))
    const phaseById = new Map(unlockedPhases.map((p) => [p.id, p]))

    const pending = allDailyTasks
      .filter((t) => !completedIds.has(t.id))
      .sort((a, b) => (phaseOrder.get(a.phaseId) ?? 0) - (phaseOrder.get(b.phaseId) ?? 0))

    if (!pending.length) return success(null)

    const task = pending[0]
    const phase = phaseById.get(task.phaseId)!

    return success({
      id:            task.id,
      title:         task.title,
      description:   task.description,
      cadence:       task.cadence,
      isDeliverable: task.isDeliverable,
      phaseId:       phase.id,
      phaseSlug:     phase.slug,
    })
  } catch (err) {
    handleError(err)
  }
})
