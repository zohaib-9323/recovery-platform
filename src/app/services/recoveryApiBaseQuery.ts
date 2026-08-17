// Base query (auth header injection + 401 refresh-and-retry) for `recoveryApi`.
// Split out of `recoveryApi.ts` purely to keep that file under the ESLint
// `max-lines` limit — no behavior change, same wiring as before.
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { logout, type AuthState } from '@/app/features/auth/authSlice'
import { refreshSession } from '@/services/authSession'
import { isAuthUrl } from '@/app/services/auth-urls'
import { runBaseQueryWithReauth } from '@/app/services/reauth'
import { env } from '@/utils/env'

type StateWithAuth = { auth: AuthState }

const baseUrl = env.apiBaseUrl.replace(/\/$/, '')

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

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  return runBaseQueryWithReauth<FetchBaseQueryError>(
    args as unknown as Record<string, unknown> | string,
    {
      dispatch: api.dispatch,
      getState: () => api.getState() as StateWithAuth,
    },
    extraOptions,
    (a, c, e) =>
      rawBaseQuery(a as string | FetchArgs, c as Parameters<typeof rawBaseQuery>[1], e as object),
    (dispatch, getState) =>
      refreshSession(
        dispatch as Parameters<typeof refreshSession>[0],
        () => getState() as StateWithAuth,
      ),
    logout,
  ) as ReturnType<BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>>
}
