import type { TenantTheme } from '@/app/features/tenant/tenantThemeSlice'

const DEFAULT_LOGO_SRC = `${process.env.PUBLIC_URL}/images/app-logo.svg`
const DEFAULT_THEME = {
  primaryColor: '#e3a602',
  secondaryColor: '#ffc221',
  hoverColor: '#fffbea',
  textOnPrimaryColor: '#ffffff',
} as const

function resolveHostnameFromUrl(value?: string): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.trim().toLowerCase()
  } catch {
    return null
  }
}

export function extractSubdomainFromHostname(
  hostname: string,
  mainSiteUrl?: string,
): string | null {
  const normalizedHost = hostname.trim().toLowerCase()
  if (!normalizedHost) return null

  const parts = normalizedHost.split('.')

  if (normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return null
  }

  if (normalizedHost.endsWith('.localhost') || normalizedHost.endsWith('.127.0.0.1')) {
    return parts[0] && parts[0] !== 'www' ? parts[0] : null
  }

  const mainSiteHostname = resolveHostnameFromUrl(mainSiteUrl)
  if (mainSiteHostname) {
    if (normalizedHost === mainSiteHostname) {
      return null
    }
    if (normalizedHost.endsWith(`.${mainSiteHostname}`)) {
      const tenantCandidate = normalizedHost.slice(0, -(mainSiteHostname.length + 1)).split('.')[0]
      return tenantCandidate && tenantCandidate !== 'www' ? tenantCandidate : null
    }
    return null
  }

  if (parts.length >= 3) {
    const subdomain = parts[0]
    return subdomain && subdomain !== 'www' ? subdomain : null
  }

  return null
}

function darkenHexColor(hex: string, amount = 20): string {
  const normalized = hex.replace('#', '').trim()
  const isHex = /^[0-9a-f]{6}$/i.test(normalized)
  if (!isHex) return hex

  const r = Math.max(0, parseInt(normalized.slice(0, 2), 16) - amount)
  const g = Math.max(0, parseInt(normalized.slice(2, 4), 16) - amount)
  const b = Math.max(0, parseInt(normalized.slice(4, 6), 16) - amount)

  const result = [r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  return `#${result}`
}

function lightenHexColor(hex: string, amount = 220): string {
  const normalized = hex.replace('#', '').trim()
  const isHex = /^[0-9a-f]{6}$/i.test(normalized)
  if (!isHex) return DEFAULT_THEME.hoverColor

  const r = Math.min(255, parseInt(normalized.slice(0, 2), 16) + amount)
  const g = Math.min(255, parseInt(normalized.slice(2, 4), 16) + amount)
  const b = Math.min(255, parseInt(normalized.slice(4, 6), 16) + amount)

  const result = [r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  return `#${result}`
}

export function applyDefaultThemeToDocument(): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.style.setProperty('--primary-color', DEFAULT_THEME.primaryColor)
  root.style.setProperty('--secondary-color', DEFAULT_THEME.secondaryColor)
  root.style.setProperty('--hover-color', DEFAULT_THEME.hoverColor)
  root.style.setProperty('--text-on-primary-color', DEFAULT_THEME.textOnPrimaryColor)
  root.style.setProperty('--rp-accent', DEFAULT_THEME.primaryColor)
  root.style.setProperty('--rp-accent-dark', darkenHexColor(DEFAULT_THEME.primaryColor))
  root.style.setProperty('--rp-icon', DEFAULT_THEME.primaryColor)
}

export function applyTenantThemeToDocument(theme: TenantTheme): void {
  if (typeof document === 'undefined') return

  const hoverColor = lightenHexColor(theme.secondaryColor || theme.primaryColor)
  const root = document.documentElement
  root.style.setProperty('--primary-color', theme.primaryColor)
  root.style.setProperty('--secondary-color', theme.secondaryColor)
  root.style.setProperty('--hover-color', hoverColor)
  root.style.setProperty('--text-on-primary-color', theme.textOnPrimaryColor)
  root.style.setProperty('--rp-accent', theme.primaryColor)
  root.style.setProperty('--rp-accent-dark', darkenHexColor(theme.primaryColor))
  root.style.setProperty('--rp-icon', theme.primaryColor)
}

export function resolveTenantLogoUrl(tenantLogoUrl?: string | null): string {
  return tenantLogoUrl?.trim() || DEFAULT_LOGO_SRC
}
