import { describe, expect, it } from 'vitest'

import authReducer, { logout, setCredentials } from './authSlice'

describe('authSlice', () => {
  it('sets credentials', () => {
    const state = authReducer(
      undefined,
      setCredentials({
        user: { id: '1', email: 'user@example.com' },
        token: 'secret',
      }),
    )
    expect(state.user?.email).toBe('user@example.com')
    expect(state.token).toBe('secret')
  })

  it('clears session on logout', () => {
    const loggedIn = authReducer(
      undefined,
      setCredentials({
        user: { id: '1', email: 'user@example.com' },
        token: 'secret',
      }),
    )
    const cleared = authReducer(loggedIn, logout())
    expect(cleared.user).toBeNull()
    expect(cleared.token).toBeNull()
  })
})
