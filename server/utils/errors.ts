import { createError } from 'h3'
import { ZodError } from 'zod'
import { apiError } from './response'

export const ErrorCode = {
  PHASE_NOT_FOUND:    'PHASE_NOT_FOUND',
  TASK_NOT_FOUND:     'TASK_NOT_FOUND',
  PHASE_LOCKED:       'PHASE_LOCKED',
  INVALID_BODY:       'INVALID_BODY',
  INVALID_PARAMS:     'INVALID_PARAMS',
  USER_STATE_MISSING: 'USER_STATE_MISSING',
  INTERNAL:           'INTERNAL',
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(err: unknown): never {
  if (err instanceof AppError) {
    throw createError({
      statusCode: err.statusCode,
      data: apiError(err.code, err.message, err.details),
    })
  }
  if (err instanceof ZodError) {
    throw createError({
      statusCode: 422,
      data: apiError(ErrorCode.INVALID_BODY, 'Validation failed', err.flatten()),
    })
  }
  console.error('[INTERNAL]', err)
  throw createError({
    statusCode: 500,
    data: apiError(ErrorCode.INTERNAL, 'An unexpected error occurred'),
  })
}
