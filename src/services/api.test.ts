import { z } from 'zod'

import { apiRequest } from './api'

describe('apiRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('serializes JSON body and parses success response', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as unknown as Response)

    const result = await apiRequest<{ ok: boolean }>('/x', {
      method: 'POST',
      body: { a: 1 },
    })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/x'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ a: 1 }) }),
    )
  })

  it('throws with response text on non-ok responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'boom',
    } as unknown as Response)

    await expect(apiRequest('/x')).rejects.toThrow('boom')
  })

  it('validates request and response schemas', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok' }),
    } as unknown as Response)

    const result = await apiRequest('/x', {
      method: 'POST',
      body: { email: 'a@b.com' },
      requestSchema: z.object({ email: z.string().email() }),
      responseSchema: z.object({ message: z.string() }),
    })

    expect(result).toEqual({ message: 'ok' })
  })

  it('fails fast for invalid request schema', async () => {
    await expect(
      apiRequest('/x', {
        method: 'POST',
        body: { email: 'invalid-email' },
        requestSchema: z.object({ email: z.string().email() }),
      }),
    ).rejects.toBeTruthy()
  })
})
