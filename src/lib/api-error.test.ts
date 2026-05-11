import { AppError, normalizeApiError } from '@/lib/api-error'

describe('normalizeApiError', () => {
  it('keeps existing AppError', () => {
    const source = new AppError('boom', 'Readable message', 'E_CUSTOM')
    const result = normalizeApiError(source, 'Fallback')
    expect(result).toBe(source)
  })

  it('maps RTK style object with message', () => {
    const result = normalizeApiError({ data: { message: 'Bad request' } }, 'Fallback')
    expect(result.userMessage).toBe('Bad request')
    expect(result.code).toBe('API_ERROR')
  })

  it('maps string body payload', () => {
    const result = normalizeApiError({ data: 'Server unavailable' }, 'Fallback')
    expect(result.userMessage).toBe('Server unavailable')
  })

  it('returns fallback for unknown values', () => {
    const result = normalizeApiError(undefined, 'Fallback message')
    expect(result.userMessage).toBe('Fallback message')
    expect(result.code).toBe('UNKNOWN_ERROR')
  })
})
