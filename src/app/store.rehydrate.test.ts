describe('buildAuthPreload', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('rehydrates auth state from persisted session', async () => {
    jest.doMock('@/services/authStorage', () => ({
      loadPersistedSession: () => ({ accessToken: 'a', refreshToken: 'r' }),
      clearPersistedSession: jest.fn(),
      persistAuthState: jest.fn(),
    }))
    jest.doMock('@/lib/jwt', () => ({
      userFromAccessToken: () => ({ id: 'u1', email: 'u@ex.com' }),
    }))

    const { buildAuthPreload } = await import('./authPreload')
    expect(buildAuthPreload()).toMatchObject({
      token: 'a',
      refreshToken: 'r',
      user: { id: 'u1', email: 'u@ex.com' },
    })
  })

  it('clears persisted session when token cannot map to a user', async () => {
    const clearPersistedSession = jest.fn()
    jest.doMock('@/services/authStorage', () => ({
      loadPersistedSession: () => ({ accessToken: 'a', refreshToken: 'r' }),
      clearPersistedSession,
      persistAuthState: jest.fn(),
    }))
    jest.doMock('@/lib/jwt', () => ({
      userFromAccessToken: () => null,
    }))

    const { buildAuthPreload } = await import('./authPreload')
    expect(buildAuthPreload()).toBeUndefined()
    expect(clearPersistedSession).toHaveBeenCalled()
  })
})
