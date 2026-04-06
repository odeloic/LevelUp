import { eq } from 'drizzle-orm'
import { db } from '../index'
import { tasks } from '../migrations/schema'
import { AppError, ErrorCode } from '../../utils/errors'

export async function getTasksForPhase(phaseId: number) {
  return db.select().from(tasks).where(eq(tasks.phaseId, phaseId)).orderBy(tasks.sortOrder)
}

export async function getTaskById(taskId: number) {
  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get()
  if (!task) {
    throw new AppError(ErrorCode.TASK_NOT_FOUND, `Task ${taskId} not found`, 404)
  }
  return task
}
