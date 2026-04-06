import { eq } from 'drizzle-orm'
import { db } from '../index'
import { resources } from '../migrations/schema'

export async function getResourcesForPhase(phaseId: number) {
  return db
    .select()
    .from(resources)
    .where(eq(resources.phaseId, phaseId))
    .orderBy(resources.sortOrder)
}
