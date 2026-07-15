export interface ApiErrorDetail {
  field?: string
  message: string
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, statusCode = 500, code?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string>

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400, 'VALIDATION_ERROR', { validationErrors: errors })
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` (${id})` : ''} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export function handleApiError(error: unknown): Response {
  console.error('[API Error]', error)

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      }),
      { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body', code: 'INVALID_JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new Response(
      JSON.stringify({ error: 'External service unavailable', code: 'SERVICE_UNAVAILABLE' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    if (err.name === 'PrismaClientKnownRequestError' && typeof err.code === 'string') {
      if (err.code === 'P2002') {
        return new Response(
          JSON.stringify({ error: 'A record with this value already exists', code: 'DUPLICATE_ENTRY' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (err.code === 'P2025') {
        return new Response(
          JSON.stringify({ error: 'Record not found', code: 'NOT_FOUND' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    if (err.name === 'ZodError' && err.flatten) {
      const zodError = err as { flatten: () => { fieldErrors: Record<string, string[]> } }
      const fieldErrors = zodError.flatten().fieldErrors
      const formatted: Record<string, string> = {}
      Object.entries(fieldErrors).forEach(([key, val]) => {
        formatted[key] = val.join(', ')
      })
      return new Response(
        JSON.stringify({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: formatted }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return new Response(
    JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}

export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}

export function createApiResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function createErrorResponse(message: string, status = 400, code = 'ERROR'): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}