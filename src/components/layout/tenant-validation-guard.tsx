import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useI18n } from '@/i18n/useI18n'
import { extractSubdomainFromHostname } from '@/lib/tenantTheme'
import { env } from '@/utils/env'

type TenantThemeData = {
  name?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  textOnPrimaryColor?: string
}

type TenantValidationEnvelope = {
  status?: boolean
  content?: {
    data?: TenantThemeData
    redirectUrl?: string
  } | null
}

type TenantValidationResult = {
  isValid: boolean
  redirectUrl?: string
  theme?: TenantThemeData
}

const MAIN_SUBDOMAINS = new Set(['dev', 'ai'])
const INVALID_SUBDOMAINS = new Set([
  'www',
  'api',
  'apidev',
  'admin',
  'mail',
  'ftp',
  'blog',
  'shop',
  'store',
  'support',
  'help',
  'docs',
  'status',
  'monitor',
])

/**
 * Attempt to darken a hex colour by a given percentage (0-100).
 * Returns the original value if parsing fails.
 */
function darkenHex(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6 && cleaned.length !== 3) return hex

  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned
  const r = Math.max(0, Math.round(parseInt(full.slice(0, 2), 16) * (1 - percent / 100)))
  const g = Math.max(0, Math.round(parseInt(full.slice(2, 4), 16) * (1 - percent / 100)))
  const b = Math.max(0, Math.round(parseInt(full.slice(4, 6), 16) * (1 - percent / 100)))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Build a very light tint of the given hex colour (used for hover backgrounds).
 */
function lightTintHex(hex: string, alpha = 0.08): string {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6 && cleaned.length !== 3) return hex

  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getMainRedirectUrlForCurrentHost(): string {
  if (typeof window === 'undefined') {
    return env.mainSiteUrl
  }

  const { protocol, hostname, port } = window.location
  const normalizedHost = hostname.toLowerCase()
  const isLocalHost =
    normalizedHost === 'localhost' ||
    normalizedHost === '127.0.0.1' ||
    normalizedHost.endsWith('.localhost') ||
    normalizedHost.endsWith('.127.0.0.1')

  if (isLocalHost) {
    return `${protocol}//localhost${port ? `:${port}` : ''}/login`
  }

  return env.mainSiteUrl
}

function applyTenantTheme(theme?: TenantThemeData) {
  if (!theme) return

  const root = document.documentElement

  if (theme.primaryColor) {
    root.style.setProperty('--primary-color', theme.primaryColor)
    root.style.setProperty('--rp-accent', theme.primaryColor)
    root.style.setProperty('--rp-accent-dark', darkenHex(theme.primaryColor, 15))
    root.style.setProperty('--rp-icon', theme.primaryColor)
    root.style.setProperty('--hover-color', lightTintHex(theme.primaryColor, 0.08))
  }

  if (theme.secondaryColor) {
    root.style.setProperty('--secondary-color', theme.secondaryColor)
  }

  if (theme.textOnPrimaryColor) {
    root.style.setProperty('--text-on-primary-color', theme.textOnPrimaryColor)
  }

  // Set tenant logo as CSS variable so components can read it
  if (theme.logoUrl) {
    root.style.setProperty('--logo-url', `url('${theme.logoUrl}')`)
    root.dataset.tenantLogo = theme.logoUrl

    // Update favicon to tenant logo (identical to TH ThemeProvider)
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
    existingFavicons.forEach((icon) => icon.remove())

    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = theme.logoUrl
    link.type = 'image/png'
    document.head.appendChild(link)

    const shortcutLink = document.createElement('link')
    shortcutLink.rel = 'shortcut icon'
    shortcutLink.href = theme.logoUrl
    shortcutLink.type = 'image/png'
    document.head.appendChild(shortcutLink)
  }

  // Update page title with tenant name
  if (theme.name) {
    document.title = `${theme.name} - Recovery Platform`
    root.dataset.tenantName = theme.name
  }
}

async function validateTenantSubdomain(subdomain: string): Promise<TenantValidationResult> {
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')
  const validationPaths = [env.recoveryTenantValidatePath, env.tenantValidatePath]

  for (const path of validationPaths) {
    const separator = path.includes('?') ? '&' : '?'
    const validationUrl = `${baseUrl}${path}${separator}tenant=${encodeURIComponent(subdomain)}`

    try {
      const response = await fetch(validationUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      const payload = (await response.json()) as TenantValidationEnvelope

      if (payload?.status === true) {
        return {
          isValid: true,
          theme: payload.content?.data,
        }
      }

      if (payload?.status === false) {
        return {
          isValid: false,
          redirectUrl: payload.content?.redirectUrl,
        }
      }
    } catch {
      // Try next validation path if this one fails
    }
  }

  return { isValid: false }
}

function ValidationLoader() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen items-center justify-center bg-rp-bg">
      <div className="flex flex-col items-center gap-4 text-rp-fg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rp-border border-t-rp-accent" />
        <p className="text-sm font-medium">{t('auth.tenantValidation.validating')}</p>
      </div>
    </div>
  )
}

export function TenantValidationGuard() {
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(true)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState(env.mainSiteUrl)

  useEffect(() => {
    let isMounted = true

    const runValidation = async () => {
      if (typeof window === 'undefined') {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      const redirectFallback = getMainRedirectUrlForCurrentHost()

      const extractedSubdomain = extractSubdomainFromHostname(
        window.location.hostname,
        env.mainSiteUrl,
      )
      setSubdomain(extractedSubdomain)

      if (!extractedSubdomain || MAIN_SUBDOMAINS.has(extractedSubdomain)) {
        if (isMounted) {
          setIsValid(true)
          setIsLoading(false)
        }
        return
      }

      if (INVALID_SUBDOMAINS.has(extractedSubdomain)) {
        if (isMounted) {
          setIsValid(false)
          setRedirectUrl(redirectFallback)
          setIsLoading(false)
        }
        return
      }

      const validationResult = await validateTenantSubdomain(extractedSubdomain)

      if (!isMounted) return

      if (validationResult.isValid) {
        applyTenantTheme(validationResult.theme)
        setIsValid(true)
      } else {
        setIsValid(false)
        setRedirectUrl(validationResult.redirectUrl ?? redirectFallback)
      }

      setIsLoading(false)
    }

    void runValidation()

    return () => {
      isMounted = false
    }
  }, [])

  const invalidRoute = useMemo(() => {
    const params = new URLSearchParams()

    if (subdomain) {
      params.set('subdomain', subdomain)
    }

    params.set('redirectUrl', redirectUrl)

    return `/invalid-subdomain?${params.toString()}`
  }, [redirectUrl, subdomain])

  if (isLoading) {
    return <ValidationLoader />
  }

  if (!isValid) {
    return <Navigate to={invalidRoute} replace />
  }

  return <Outlet />
}
