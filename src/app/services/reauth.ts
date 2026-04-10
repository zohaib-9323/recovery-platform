type QueryResult<TError> = { data: unknown } | { error: TError }

type BaseQueryLike<TError> = (
  args: unknown,
  context: unknown,
  extraOptions: unknown,
) => QueryResult<TError> | PromiseLike<QueryResult<TError>>

type ReauthContext = {
  dispatch: (...args: unknown[]) => unknown
  getState: () => unknown
}

type AuthErrorLike = {
  status?: number | string
}

function isAuthUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes('/recovery/auth/login') ||
    url.includes('/recovery/auth/refresh') ||
    url.includes('/recovery/auth/request-password-reset') ||
    url.includes('/recovery/auth/reset-password')
  )
}

export async function runBaseQueryWithReauth<TError extends AuthErrorLike>(
  args: Record<string, unknown> | string,
  context: ReauthContext,
  extraOptions: unknown,
  runBaseQuery: BaseQueryLike<TError>,
  refresh: (
    dispatch: ReauthContext['dispatch'],
    getState: ReauthContext['getState'],
  ) => Promise<boolean>,
  onRefreshFailure: () => unknown,
): Promise<QueryResult<TError>> {
  const argObj = typeof args === 'string' ? { url: args } : args
  const url = typeof argObj.url === 'string' ? argObj.url : ''
  const skipReauth = isAuthUrl(url)

  let result = await Promise.resolve(runBaseQuery(args, context, extraOptions))
  if ('error' in result && result.error?.status === 401 && !skipReauth) {
    const ok = await refresh(context.dispatch, context.getState)
    if (ok) {
      result = await Promise.resolve(runBaseQuery(args, context, extraOptions))
    } else {
      context.dispatch(onRefreshFailure())
    }
  }

  return result
}
