export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 2, retryDelay = 1000, ...fetchOptions } = options

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions)

      if (!res.ok) {
        const body = await res.text()
        throw new ApiError(
          body ? (JSON.parse(body).error || `Request failed (${res.status})`) : `Request failed (${res.status})`,
          res.status
        )
      }

      return res
    } catch (err) {
      if (attempt === retries) throw err
      if (err instanceof ApiError && err.status < 500) throw err
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
    }
  }

  throw new ApiError('Max retries exceeded', 0)
}

export async function fetchJson<T>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  const res = await fetchWithRetry(url, options)
  return res.json()
}
