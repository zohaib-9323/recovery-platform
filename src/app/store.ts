import { configureStore } from '@reduxjs/toolkit'

import authReducer, { authInitialState } from '@/app/features/auth/authSlice'
import { recoveryApi } from '@/app/services/recoveryApi'
import sideBarReducer from '@/app/features/ui/sideBarSlice'
import { userFromAccessToken } from '@/lib/jwt'
import {
  clearPersistedSession,
  loadPersistedSession,
  persistAuthState,
} from '@/services/authStorage'

function buildAuthPreload() {
  const persisted = loadPersistedSession()
  if (!persisted) return undefined
  const user = userFromAccessToken(persisted.accessToken)
  if (!user) {
    clearPersistedSession()
    return undefined
  }
  return {
    ...authInitialState,
    token: persisted.accessToken,
    refreshToken: persisted.refreshToken,
    user,
  }
}

const authPreload = buildAuthPreload()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sideBar: sideBarReducer,
    [recoveryApi.reducerPath]: recoveryApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(recoveryApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: authPreload ? { auth: authPreload } : undefined,
})

store.subscribe(() => {
  const { token, refreshToken } = store.getState().auth
  persistAuthState(token, refreshToken)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
