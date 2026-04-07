import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/app/features/auth/authSlice'
import { recoveryApi } from '@/app/services/recoveryApi'
import sideBarReducer from '@/app/features/ui/sideBarSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sideBar: sideBarReducer,
    [recoveryApi.reducerPath]: recoveryApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(recoveryApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
