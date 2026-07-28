import { describe, it, expect, vi } from 'vitest'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  handleApiError,
  withErrorHandler,
  createApiResponse,
  createErrorResponse,
} from '@/lib/api-errors'
import { NextRequest, NextResponse } from 'next/server'

describe('api-errors', () => {
  describe('AppError', () => {
    it('creates error with default status 500', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
    })

    it('creates error with custom status and code', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('ValidationError', () => {
    it('creates validation error with details', () => {
      const error = new ValidationError('Invalid input', { email: 'Invalid format' })
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.errors).toEqual({ email: 'Invalid format' })
    })
  })

  describe('AuthenticationError', () => {
    it('creates auth error with default message', () => {
      const error = new AuthenticationError()
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('creates auth error with custom message', () => {
      const error = new AuthenticationError('Token expired')
      expect(error.message).toBe('Token expired')
    })
  })

  describe('AuthorizationError', () => {
    it('creates authorization error', () => {
      const error = new AuthorizationError('Admin only')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('NotFoundError', () => {
    it('creates not found error', () => {
      const error = new NotFoundError('User')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('RateLimitError', () => {
    it('creates rate limit error', () => {
      const error = new RateLimitError('Too many requests')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('handleApiError', () => {
    it('handles AppError', async () => {
      const error = new AppError('Custom error', 400, 'CUSTOM')
      const response = handleApiError(error)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Custom error')
      expect(data.code).toBe('CUSTOM')
    })

    it('handles ValidationError', async () => {
      const error = new ValidationError('Invalid', { field: 'error' })
      const response = handleApiError(error)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
    })

    it('handles Prisma P2002 (unique constraint)', async () => {
      const error = { name: 'PrismaClientKnownRequestError', code: 'P2002' }
      const response = handleApiError(error)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.code).toBe('DUPLICATE_ENTRY')
    })

    it('handles Prisma P2025 (not found)', async () => {
      const error = { name: 'PrismaClientKnownRequestError', code: 'P2025' }
      const response = handleApiError(error)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.code).toBe('NOT_FOUND')
    })

    it('handles ZodError', async () => {
      const error = { name: 'ZodError', flatten: () => ({ fieldErrors: { email: ['Invalid'] } }) }
      const response = handleApiError(error)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
    })

    it('returns 500 for unknown errors', async () => {
      const error = new Error('Unknown')
      const response = handleApiError(error)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('withErrorHandler', () => {
    it('wraps handler and catches errors', async () => {
      const handler = vi.fn().mockRejectedValue(new AppError('Handler error', 400))
      const wrapped = withErrorHandler(handler)

      const req = new NextRequest('http://test.com/api/test')
      const response = await wrapped(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Handler error')
    })

    it('returns success response on successful handler', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const wrapped = withErrorHandler(handler)

      const req = new NextRequest('http://test.com/api/test')
      const response = await wrapped(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('createApiResponse', () => {
    it('creates successful response', () => {
      const response = createApiResponse({ data: 'test' }, 201)
      expect(response.status).toBe(201)
    })
  })

  describe('createErrorResponse', () => {
    it('creates error response', () => {
      const response = createErrorResponse('Not found', 404, 'NOT_FOUND')
      expect(response.status).toBe(404)
    })
  })
})