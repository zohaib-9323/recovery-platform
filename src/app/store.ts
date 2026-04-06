import { configureStore } from '@reduxjs/toolkit'

import authReducer from '@/app/features/auth/authSlice'
import sideBarReducer from '@/app/features/ui/sideBarSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sideBar: sideBarReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
