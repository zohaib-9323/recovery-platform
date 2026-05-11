import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useI18n } from '@/i18n/useI18n'
import { env } from '@/utils/env'

export function InvalidSubdomainPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()

  const subdomain = searchParams.get('subdomain')
  const redirectUrl = searchParams.get('redirectUrl') || env.mainSiteUrl

  useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = window.setTimeout(() => {
      window.location.replace(redirectUrl)
    }, 600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [redirectUrl])

  const title = useMemo(() => {
    if (!subdomain) {
      return t('auth.invalidSubdomain.defaultTitle')
    }

    return t('auth.invalidSubdomain.unavailableTitle', { subdomain })
  }, [subdomain, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-rp-bg px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-rp-border bg-white p-8 shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3Z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-center text-2xl font-semibold text-rp-heading">{title}</h1>

        <p className="mt-4 text-center text-sm text-rp-muted">
          {t('auth.invalidSubdomain.description')}
        </p>

        <div className="mt-8 flex justify-center">
          <a
            href={redirectUrl}
            className="inline-flex items-center justify-center rounded-[10px] bg-rp-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-rp-accent-dark"
          >
            {t('auth.invalidSubdomain.goToMainSite')}
          </a>
        </div>
      </div>
    </div>
  )
}
