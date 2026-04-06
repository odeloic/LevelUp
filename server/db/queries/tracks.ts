import { eq, and, or, isNotNull } from 'drizzle-orm'
import { db } from '../index'
import { tracks, phases, tasks, completions } from '../migrations/schema'
import { isPhaseUnlocked } from './phases'
import { AppError, ErrorCode } from '../../utils/errors'

export type PhaseWithProgress = {
  id: number
  slug: string
  title: string
  description: string | null
  weekStart: number
  weekEnd: number
  sortOrder: number
  unlockRequiresPhaseId: number | null
  isUnlocked: boolean
  deliverableCount: number
  completedDeliverableCount: number
  blockingTasks: { id: number; title: string }[]
}

export type TrackWithPhases = {
  id: number
  slug: string
  title: string
  description: string | null
  color: string
  icon: string
  sortOrder: number
  phases: PhaseWithProgress[]
}

async function enrichPhase(phase: typeof phases.$inferSelect): Promise<PhaseWithProgress> {
  const [unlocked, allTasks] = await Promise.all([
    isPhaseUnlocked(phase.id),
    db.select().from(tasks).where(eq(tasks.phaseId, phase.id)),
  ])

  const deliverableTasks = allTasks.filter((t) => t.isDeliverable === 1)

  const completedDeliverableCount = (
    await Promise.all(
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
        return row !== undefined ? 1 : 0
      }),
    )
  ).reduce((a, b) => a + b, 0)

  // If locked, find which deliverables are blocking it (incomplete deliverables in the required phase)
  let blockingTasks: { id: number; title: string }[] = []
  if (!unlocked && phase.unlockRequiresPhaseId !== null) {
    const reqDeliverables = await db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(and(eq(tasks.phaseId, phase.unlockRequiresPhaseId), eq(tasks.isDeliverable, 1)))

    blockingTasks = (
      await Promise.all(
        reqDeliverables.map(async (task) => {
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
          return row === undefined ? task : null
        }),
      )
    ).filter((t): t is { id: number; title: string } => t !== null)
  }

  return {
    id: phase.id,
    slug: phase.slug,
    title: phase.title,
    description: phase.description,
    weekStart: phase.weekStart,
    weekEnd: phase.weekEnd,
    sortOrder: phase.sortOrder,
    unlockRequiresPhaseId: phase.unlockRequiresPhaseId,
    isUnlocked: unlocked,
    deliverableCount: deliverableTasks.length,
    completedDeliverableCount,
    blockingTasks,
  }
}

export async function getTracks(): Promise<TrackWithPhases[]> {
  const allTracks = await db.select().from(tracks).orderBy(tracks.sortOrder)
  return Promise.all(allTracks.map(async (track) => {
    const trackPhases = await db
      .select()
      .from(phases)
      .where(eq(phases.trackId, track.id))
      .orderBy(phases.sortOrder)
    const enriched = await Promise.all(trackPhases.map(enrichPhase))
    return { ...track, phases: enriched }
  }))
}

export async function getTrackBySlug(slug: string): Promise<TrackWithPhases> {
  const track = await db.select().from(tracks).where(eq(tracks.slug, slug)).get()
  if (!track) {
    throw new AppError(ErrorCode.TRACK_NOT_FOUND, `Track '${slug}' not found`, 404)
  }
  const trackPhases = await db
    .select()
    .from(phases)
    .where(eq(phases.trackId, track.id))
    .orderBy(phases.sortOrder)
  const enriched = await Promise.all(trackPhases.map(enrichPhase))
  return { ...track, phases: enriched }
}
