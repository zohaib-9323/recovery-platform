import { env } from '@/utils/env'
import type { ZodType } from 'zod'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  requestSchema?: ZodType
  responseSchema?: ZodType
}

type TypedJson = Record<string, unknown> | unknown[]

/**
 * Thin fetch wrapper — extend with auth headers from Redux or interceptors as the app grows.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const validatedBody =
    options.requestSchema && options.body !== undefined
      ? options.requestSchema.parse(options.body)
      : options.body
  const url = path.startsWith('http') ? path : `${env.apiBaseUrl.replace(/\/$/, '')}${path}`

  const headers = new Headers(options.headers)
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body:
      validatedBody !== undefined && !(validatedBody instanceof FormData)
        ? JSON.stringify(validatedBody)
        : validatedBody,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  const json = (await response.json()) as TypedJson
  if (options.responseSchema) {
    return options.responseSchema.parse(json) as T
  }
  return json as T
}
