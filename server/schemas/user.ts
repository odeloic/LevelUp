import { z } from 'zod'

export const UpdateUserStateBody = z.object({
  currentWeek:    z.number().int().positive().optional(),
  streakDays:     z.number().int().min(0).optional(),
  lastActiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startedAt:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  xp:             z.number().int().min(0).optional(),
}).refine(
  (v) => Object.values(v).some((x) => x !== undefined),
  { message: 'At least one field must be provided' },
)

export type UpdateUserStateBody = z.infer<typeof UpdateUserStateBody>
