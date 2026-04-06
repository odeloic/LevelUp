import { z } from 'zod'

export const LogCompletionBody = z.object({
  taskId:     z.number().int().positive(),
  weekNumber: z.number().int().positive().optional(),
  dayDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  prUrl:      z.string().url().optional(),
  notes:      z.string().max(2000).optional(),
})

export type LogCompletionBody = z.infer<typeof LogCompletionBody>
