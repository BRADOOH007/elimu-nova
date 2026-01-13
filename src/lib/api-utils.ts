/**
 * API utilities for safe response handling
 */

export interface ApiError {
  error?: string
  details?: string
  message?: string
}

/**
 * Safely parse JSON from a response, handling cases where the response body is not valid JSON
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T | null> {
  try {
    const text = await response.text()
    if (!text.trim()) {
      return null
    }
    return JSON.parse(text) as T
  } catch (error) {
    console.warn('Failed to parse JSON response:', error)
    return null
  }
}

/**
 * Get error message from a failed response
 */
export async function getErrorMessage(response: Response, defaultMessage: string = 'An error occurred'): Promise<string> {
  try {
    const errorData = await safeJsonParse<ApiError>(response)
    if (errorData) {
      return errorData.error || errorData.details || errorData.message || defaultMessage
    }
  } catch (error) {
    // Ignore parsing errors
  }
  
  // Fallback to HTTP status
  return `HTTP ${response.status}: ${response.statusText || defaultMessage}`
}

/**
 * Handle API response with proper error handling
 */
export async function handleApiResponse<T = any>(
  response: Response,
  options?: {
    successMessage?: string
    errorMessage?: string
    throwOnError?: boolean
  }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { successMessage, errorMessage = 'Request failed', throwOnError = false } = options || {}
  
  if (response.ok) {
    const data = await safeJsonParse<T>(response)
    return { success: true, data: data || undefined }
  } else {
    const error = await getErrorMessage(response, errorMessage)
    if (throwOnError) {
      throw new Error(error)
    }
    return { success: false, error }
  }
}

/**
 * Make a safe API request with proper error handling
 */
export async function safeApiRequest<T = any>(
  url: string,
  options?: RequestInit & {
    successMessage?: string
    errorMessage?: string
    throwOnError?: boolean
  }
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { successMessage, errorMessage, throwOnError, ...fetchOptions } = options || {}
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })
    
    return handleApiResponse<T>(response, { successMessage, errorMessage, throwOnError })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error'
    if (options?.throwOnError) {
      throw error
    }
    return { success: false, error: errorMessage }
  }
}

export default {
  safeJsonParse,
  getErrorMessage,
  handleApiResponse,
  safeApiRequest,
}