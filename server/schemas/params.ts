import { z } from 'zod'

export const PhaseIdParam = z.object({
  id: z.coerce.number().int().positive(),
})

export type PhaseIdParam = z.infer<typeof PhaseIdParam>
