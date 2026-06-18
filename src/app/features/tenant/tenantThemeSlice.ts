import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type TenantTheme = {
  _id: string
  subdomain: string
  name: string
  primaryColor: string
  secondaryColor: string
  textOnPrimaryColor: string
  logoUrl?: string
  status?: string
}

export type TenantThemeState = {
  subdomain: string | null
  tenant: TenantTheme | null
  isLoading: boolean
  error: string | null
}

const initialState: TenantThemeState = {
  subdomain: null,
  tenant: null,
  isLoading: false,
  error: null,
}

const tenantThemeSlice = createSlice({
  name: 'tenantTheme',
  initialState,
  reducers: {
    setTenantThemeLoading: (
      state,
      action: PayloadAction<{
        subdomain: string
      }>,
    ) => {
      state.subdomain = action.payload.subdomain
      state.isLoading = true
      state.error = null
    },
    setTenantThemeSuccess: (
      state,
      action: PayloadAction<{
        subdomain: string
        tenant: TenantTheme
      }>,
    ) => {
      state.subdomain = action.payload.subdomain
      state.tenant = action.payload.tenant
      state.isLoading = false
      state.error = null
    },
    setTenantThemeError: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
      state.tenant = null
    },
    clearTenantTheme: (state) => {
      state.subdomain = null
      state.tenant = null
      state.isLoading = false
      state.error = null
    },
  },
})

export const {
  setTenantThemeLoading,
  setTenantThemeSuccess,
  setTenantThemeError,
  clearTenantTheme,
} = tenantThemeSlice.actions

export default tenantThemeSlice.reducer
