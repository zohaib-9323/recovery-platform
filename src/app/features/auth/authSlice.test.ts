import authReducer, { applyTokens, logout, setCredentials } from './authSlice'

describe('authSlice', () => {
  it('sets credentials', () => {
    const state = authReducer(
      undefined,
      setCredentials({
        user: { id: '1', email: 'user@example.com' },
        token: 'secret',
        refreshToken: 'rt',
      }),
    )
    expect(state.user?.email).toBe('user@example.com')
    expect(state.token).toBe('secret')
    expect(state.refreshToken).toBe('rt')
  })

  it('clears session on logout', () => {
    const loggedIn = authReducer(
      undefined,
      setCredentials({
        user: { id: '1', email: 'user@example.com' },
        token: 'secret',
        refreshToken: 'rt',
      }),
    )
    const cleared = authReducer(loggedIn, logout())
    expect(cleared.user).toBeNull()
    expect(cleared.token).toBeNull()
    expect(cleared.refreshToken).toBeNull()
  })

  it('applyTokens derives user from JWT payload', () => {
    // eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoidUBleC5jb20iLCJleHAiOjk5OTk5OTk5OTl9.x
    const header = btoa(JSON.stringify({ alg: 'none' }))
    const payload = btoa(JSON.stringify({ sub: 'u1', email: 'u@ex.com', exp: 9999999999 }))
    const token = `${header}.${payload}.x`
    const next = authReducer(undefined, applyTokens({ accessToken: token, refreshToken: 'r2' }))
    expect(next.token).toBe(token)
    expect(next.refreshToken).toBe('r2')
    expect(next.user?.id).toBe('u1')
    expect(next.user?.email).toBe('u@ex.com')
  })
})
