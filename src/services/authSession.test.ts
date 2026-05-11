import { applyTokens } from '@/app/features/auth/authSlice'

import { refreshSession } from './authSession'

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.x`
}

describe('refreshSession', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns false when refresh token is missing', async () => {
    const dispatch = jest.fn()
    const ok = await refreshSession(dispatch, () => ({ auth: { refreshToken: null } }))
    expect(ok).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('applies new tokens when refresh succeeds', async () => {
    const dispatch = jest.fn()
    const nextAccess = makeJwt({ sub: 'u1', email: 'u@ex.com', exp: 9999999999 })
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: { access_token: nextAccess, refresh_token: 'next-refresh' },
      }),
    } as unknown as Response)

    const ok = await refreshSession(dispatch, () => ({ auth: { refreshToken: 'old-refresh' } }))
    expect(ok).toBe(true)
    expect(dispatch).toHaveBeenCalledWith(
      applyTokens({ accessToken: nextAccess, refreshToken: 'next-refresh' }),
    )
  })

  it('returns false when refresh response is invalid JSON', async () => {
    const dispatch = jest.fn()
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('invalid-json')
      },
    } as unknown as Response)

    const ok = await refreshSession(dispatch, () => ({ auth: { refreshToken: 'old-refresh' } }))
    expect(ok).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
  })
})
