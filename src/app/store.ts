import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/app/features/auth/authSlice'
import { buildAuthPreload } from '@/app/authPreload'
import { recoveryApi } from '@/app/services/recoveryApi'
import sideBarReducer from '@/app/features/ui/sideBarSlice'
import { persistAuthState } from '@/services/authStorage'

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
  if (storeSubscribeCache.token === token && storeSubscribeCache.refreshToken === refreshToken) {
    return
  }
  storeSubscribeCache = { token, refreshToken }
  persistAuthState(token, refreshToken)
})

let storeSubscribeCache: { token: string | null; refreshToken: string | null } = {
  token: store.getState().auth.token,
  refreshToken: store.getState().auth.refreshToken,
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
