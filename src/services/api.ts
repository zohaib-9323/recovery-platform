import { env } from '@/utils/env'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

/**
 * Thin fetch wrapper — extend with auth headers from Redux or interceptors as the app grows.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${env.apiBaseUrl.replace(/\/$/, '')}${path}`

  const headers = new Headers(options.headers)
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body:
      options.body !== undefined && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
