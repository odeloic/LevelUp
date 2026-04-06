import { eq, desc } from 'drizzle-orm'
import { db } from '../../db/index'
import { completions, tasks, phases, tracks } from '../../db/migrations/schema'
import { success } from '../../utils/response'
import { handleError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const phaseId = query.phaseId ? Number(query.phaseId) : null

    const rows = await db
      .select({
        id:          completions.id,
        taskId:      completions.taskId,
        taskTitle:   tasks.title,
        phaseId:     tasks.phaseId,
        phaseTitle:  phases.title,
        phaseSlug:   phases.slug,
        trackId:     phases.trackId,
        trackTitle:  tracks.title,
        trackSlug:   tracks.slug,
        completedAt: completions.completedAt,
        prUrl:       completions.prUrl,
        notes:       completions.notes,
        weekNumber:  completions.weekNumber,
      })
      .from(completions)
      .innerJoin(tasks, eq(completions.taskId, tasks.id))
      .innerJoin(phases, eq(tasks.phaseId, phases.id))
      .innerJoin(tracks, eq(phases.trackId, tracks.id))
      .where(phaseId ? eq(tasks.phaseId, phaseId) : undefined)
      .orderBy(desc(completions.completedAt))

    return success(rows)
  } catch (err) {
    handleError(err)
  }
})
