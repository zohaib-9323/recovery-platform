import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { applyTokens, logout, type AuthState } from '@/app/features/auth/authSlice'
import { refreshSession } from '@/services/authSession'
import type {
  ApiMessageEnvelope,
  LoginRequestBody,
  RecoveryAuthEnvelope,
  RequestPasswordResetBody,
  ResetPasswordBody,
} from '@/types/auth-api'
import type {
  RecoveryApiEnvelope,
  RecoveryChangePasswordBody,
  RecoveryDeleteRequestBody,
  RecoveryPreferences,
  RecoveryPreferencesBody,
  RecoveryProfilePatchBody,
  RecoveryUserProfile,
} from '@/types/recovery-user-api'
import { env } from '@/utils/env'

type StateWithAuth = { auth: AuthState }

const baseUrl = env.apiBaseUrl.replace(/\/$/, '')

function isAuthUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes('/recovery/auth/login') ||
    url.includes('/recovery/auth/refresh') ||
    url.includes('/recovery/auth/request-password-reset') ||
    url.includes('/recovery/auth/reset-password')
  )
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState, arg }) => {
    const a = typeof arg === 'string' ? { url: arg } : arg
    const url = typeof a.url === 'string' ? a.url : ''
    if (!isAuthUrl(url)) {
      const token = (getState() as StateWithAuth).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const argObj = typeof args === 'string' ? { url: args } : args
  const url = typeof argObj.url === 'string' ? argObj.url : ''
  const skipReauth = isAuthUrl(url)

  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401 && !skipReauth) {
    const ok = await refreshSession(api.dispatch, () => api.getState() as StateWithAuth)
    if (ok) {
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      api.dispatch(logout())
    }
  }

  return result
}

export const recoveryApi = createApi({
  reducerPath: 'recoveryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['RecoveryProfile', 'RecoveryPreferences'],
  endpoints: (builder) => ({
    login: builder.mutation<RecoveryAuthEnvelope, LoginRequestBody>({
      query: (body) => ({
        url: '/recovery/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const c = data.content
          if (c?.access_token && c?.refresh_token) {
            dispatch(
              applyTokens({
                accessToken: c.access_token,
                refreshToken: c.refresh_token,
              }),
            )
          }
        } catch {
          /* error surfaced to caller */
        }
      },
    }),
    requestPasswordReset: builder.mutation<ApiMessageEnvelope<null>, RequestPasswordResetBody>({
      query: (body) => ({
        url: '/recovery/auth/request-password-reset',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<ApiMessageEnvelope<null>, ResetPasswordBody>({
      query: (body) => ({
        url: '/recovery/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    getRecoveryProfile: builder.query<RecoveryApiEnvelope<RecoveryUserProfile>, void>({
      query: () => ({ url: '/recovery/users/profile', method: 'GET' }),
      providesTags: [{ type: 'RecoveryProfile', id: 'ME' }],
    }),
    patchRecoveryProfile: builder.mutation<
      RecoveryApiEnvelope<RecoveryUserProfile>,
      RecoveryProfilePatchBody
    >({
      query: (body) => ({
        url: '/recovery/users/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'RecoveryProfile', id: 'ME' }],
    }),
    getRecoveryPreferences: builder.query<RecoveryApiEnvelope<RecoveryPreferences>, void>({
      query: () => ({ url: '/recovery/users/preferences', method: 'GET' }),
      providesTags: [{ type: 'RecoveryPreferences', id: 'ME' }],
    }),
    postRecoveryPreferences: builder.mutation<
      RecoveryApiEnvelope<RecoveryPreferences>,
      RecoveryPreferencesBody
    >({
      query: (body) => ({
        url: '/recovery/users/preferences',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RecoveryPreferences', id: 'ME' }],
    }),
    postRecoveryDeleteRequest: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      RecoveryDeleteRequestBody
    >({
      query: (body) => ({
        url: '/recovery/users/delete-request',
        method: 'POST',
        body,
      }),
    }),
    postRecoveryChangePassword: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      RecoveryChangePasswordBody
    >({
      query: (body) => ({
        url: '/recovery/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useGetRecoveryProfileQuery,
  usePatchRecoveryProfileMutation,
  useGetRecoveryPreferencesQuery,
  usePostRecoveryPreferencesMutation,
  usePostRecoveryDeleteRequestMutation,
  usePostRecoveryChangePasswordMutation,
} = recoveryApi
