import {
  clearPersistedSession,
  loadPersistedSession,
  persistAuthState,
  type PersistedAuthPayload,
} from './authStorage'

const LEGACY_KEY = 'recovery_platform_auth_v1'
const ACTIVE_KEY = 'recovery_platform_auth_v2'

function makeJwt(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ sub: 'u1', email: 'u@ex.com', exp: expSeconds }))
  return `${header}.${body}.x`
}

describe('authStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    jest.restoreAllMocks()
  })

  it('persists a versioned envelope in session storage', () => {
    const accessToken = makeJwt(Math.floor(Date.now() / 1000) + 3600)
    persistAuthState(accessToken, 'refresh-1')

    const raw = window.sessionStorage.getItem(ACTIVE_KEY)
    expect(raw).toBeTruthy()
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull()

    const parsed = JSON.parse(raw as string) as PersistedAuthPayload & { expiresAtMs: number }
    expect(parsed.accessToken).toBe(accessToken)
    expect(parsed.refreshToken).toBe('refresh-1')
    expect(parsed.expiresAtMs).toBeGreaterThan(Date.now())
  })

  it('migrates legacy localStorage session to sessionStorage', () => {
    const legacy: PersistedAuthPayload = {
      accessToken: makeJwt(Math.floor(Date.now() / 1000) + 7200),
      refreshToken: 'legacy-refresh',
    }
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const loaded = loadPersistedSession()
    expect(loaded).toEqual(legacy)
    expect(window.sessionStorage.getItem(ACTIVE_KEY)).toBeTruthy()
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('clears expired envelopes during load', () => {
    const expired = {
      accessToken: makeJwt(Math.floor(Date.now() / 1000) - 3600),
      refreshToken: 'expired-refresh',
      expiresAtMs: Date.now() - 1000,
    }
    window.sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(expired))

    expect(loadPersistedSession()).toBeNull()
  })

  it('clears all persisted session data', () => {
    persistAuthState(makeJwt(Math.floor(Date.now() / 1000) + 3600), 'refresh-x')
    clearPersistedSession()
    expect(window.sessionStorage.getItem(ACTIVE_KEY)).toBeNull()
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull()
  })
})
