import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { User } from '@/types'

export type AuthState = {
  user: User | null
  token: string | null
  status: 'idle' | 'loading'
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.status = 'idle'
    },
    logout: (state) => {
      state.user = null
      state.token = null
    },
    setAuthStatus: (state, action: PayloadAction<AuthState['status']>) => {
      state.status = action.payload
    },
  },
})

export const { setCredentials, logout, setAuthStatus } = authSlice.actions
export default authSlice.reducer
