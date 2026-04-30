import { useEffect } from 'react'
import { useLazyValidateTenantSubdomainQuery } from '@/app/services/recoveryApi'

import {
  clearTenantTheme,
  setTenantThemeError,
  setTenantThemeLoading,
  setTenantThemeSuccess,
} from '@/app/features/tenant/tenantThemeSlice'
import { useAppDispatch, useAppSelector } from '@/app/redux-hooks'
import { InvalidSubdomainPage } from '@/components/tenant/InvalidSubdomainPage'
import { TenantValidationLoader } from '@/components/tenant/TenantValidationLoader'
import { reportRuntimeError } from '@/lib/error-reporting'
import {
  applyDefaultThemeToDocument,
  applyTenantThemeToDocument,
  extractSubdomainFromHostname,
} from '@/lib/tenantTheme'
import { env } from '@/utils/env'

function deriveMainDomainUrl(subdomain: string): string {
  if (typeof window === 'undefined') return env.mainSiteUrl

  const { protocol, hostname, port } = window.location
  if (hostname.endsWith('.localhost') || hostname.endsWith('.127.0.0.1')) {
    return `${protocol}//localhost${port ? `:${port}` : ''}/login`
  }

  const labels = hostname.split('.')
  if (labels[0] === subdomain && labels.length > 1) {
    try {
      const configuredMainHost = new URL(env.mainSiteUrl).hostname.toLowerCase()
      if (
        hostname.toLowerCase() === configuredMainHost ||
        hostname.toLowerCase().endsWith(`.${configuredMainHost}`)
      ) {
        return env.mainSiteUrl
      }
    } catch {
      // Fallback to hostname-derived URL when main site URL is not a valid absolute URL.
    }
    return `${protocol}//${labels.slice(1).join('.')}${port ? `:${port}` : ''}`
  }

  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}

export function TenantThemeBootstrap() {
  const dispatch = useAppDispatch()
  const tenantTheme = useAppSelector((state) => state.tenantTheme)
  const [validateTenantSubdomain] = useLazyValidateTenantSubdomainQuery()

  const detectedSubdomain =
    typeof window === 'undefined'
      ? null
      : extractSubdomainFromHostname(window.location.hostname, env.mainSiteUrl)
  const shouldBlockUntilTenantReady =
    Boolean(detectedSubdomain) &&
    (tenantTheme.isLoading || tenantTheme.subdomain !== detectedSubdomain)
  const showInvalidSubdomain =
    Boolean(detectedSubdomain) &&
    Boolean(tenantTheme.error) &&
    !tenantTheme.isLoading &&
    tenantTheme.subdomain === detectedSubdomain

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hostname = window.location.hostname
    if (!hostname) return

    const subdomain = extractSubdomainFromHostname(hostname, env.mainSiteUrl)
    if (!subdomain) {
      applyDefaultThemeToDocument()
      dispatch(clearTenantTheme())
      return
    }

    dispatch(setTenantThemeLoading({ subdomain }))

    void (async () => {
      try {
        const response = await validateTenantSubdomain({ tenant: subdomain }).unwrap()

        const tenant = response.content?.data
        if (!tenant) {
          applyDefaultThemeToDocument()
          dispatch(setTenantThemeError('Tenant theme was not found.'))
          return
        }

        dispatch(setTenantThemeSuccess({ subdomain, tenant }))
        applyTenantThemeToDocument(tenant)
      } catch (error) {
        reportRuntimeError('tenant-theme-bootstrap:validateTenantSubdomain', error)
        applyDefaultThemeToDocument()
        dispatch(setTenantThemeError('Unable to validate tenant subdomain.'))
      }
    })()
  }, [dispatch, validateTenantSubdomain])

  if (!shouldBlockUntilTenantReady) {
    if (showInvalidSubdomain && detectedSubdomain) {
      return (
        <InvalidSubdomainPage
          subdomain={detectedSubdomain}
          redirectUrl={deriveMainDomainUrl(detectedSubdomain)}
        />
      )
    }
    return null
  }

  return <TenantValidationLoader className="fixed inset-0 z-[9999] bg-white" />
}
