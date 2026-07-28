import { z } from 'zod'
import { ValidationError } from './api-errors'

export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    const flattened = result.error.flatten().fieldErrors
    for (const key of Object.keys(flattened)) {
      const val = flattened[key]
      if (val) fieldErrors[key] = val.join(', ')
    }
    const firstKey = Object.keys(fieldErrors)[0]
    const message = firstKey ? `${firstKey}: ${fieldErrors[firstKey]}` : 'Validation failed'
    throw new ValidationError(message, fieldErrors)
  }
  return result.data
}
