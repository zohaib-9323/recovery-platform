import { runBaseQueryWithReauth } from './reauth'

describe('runBaseQueryWithReauth', () => {
  it('retries original request after successful refresh', async () => {
    const dispatch = jest.fn()
    const getState = jest.fn(() => ({ auth: { token: 't', refreshToken: 'r' } }))
    const runBaseQuery = jest
      .fn()
      .mockResolvedValueOnce({ error: { status: 401 } })
      .mockResolvedValueOnce({ data: { ok: true } })
    const refresh = jest.fn().mockResolvedValue(true)

    const result = await runBaseQueryWithReauth(
      { url: '/recovery/users/profile', method: 'GET' },
      { dispatch, getState },
      {},
      runBaseQuery,
      refresh,
      () => ({ type: 'auth/logout' }),
    )

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(runBaseQuery).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: { ok: true } })
  })

  it('logs out when refresh fails after 401', async () => {
    const dispatch = jest.fn()
    const getState = jest.fn(() => ({ auth: { token: 't', refreshToken: 'r' } }))
    const runBaseQuery = jest.fn().mockResolvedValue({ error: { status: 401 } })
    const refresh = jest.fn().mockResolvedValue(false)

    const result = await runBaseQueryWithReauth(
      { url: '/recovery/users/profile', method: 'GET' },
      { dispatch, getState },
      {},
      runBaseQuery,
      refresh,
      () => ({ type: 'auth/logout' }),
    )

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/logout' })
    expect(result).toEqual({ error: { status: 401 } })
  })

  it('does not attempt refresh for auth endpoints', async () => {
    const dispatch = jest.fn()
    const getState = jest.fn(() => ({ auth: { token: 't', refreshToken: 'r' } }))
    const runBaseQuery = jest.fn().mockResolvedValue({ error: { status: 401 } })
    const refresh = jest.fn().mockResolvedValue(true)

    await runBaseQueryWithReauth(
      { url: '/recovery/auth/login', method: 'POST' },
      { dispatch, getState },
      {},
      runBaseQuery,
      refresh,
      () => ({ type: 'auth/logout' }),
    )

    expect(refresh).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'auth/logout' })
  })
})
