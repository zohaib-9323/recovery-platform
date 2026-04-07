import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { userFromAccessToken } from '@/lib/jwt'
import type { User } from '@/types'

export type AuthState = {
  user: User | null
  token: string | null
  refreshToken: string | null
  status: 'idle' | 'loading'
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  status: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken?: string | null }>,
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken ?? null
      state.status = 'idle'
    },
    /** Sets access + refresh from API and derives `user` from the access JWT. */
    applyTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.token = action.payload.accessToken
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken
      }
      const u = userFromAccessToken(action.payload.accessToken)
      if (u) state.user = u
      state.status = 'idle'
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
    },
    setAuthStatus: (state, action: PayloadAction<AuthState['status']>) => {
      state.status = action.payload
    },
  },
})

export const { setCredentials, applyTokens, logout, setAuthStatus } = authSlice.actions
export default authSlice.reducer
