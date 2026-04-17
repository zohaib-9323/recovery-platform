import { useAppSelector } from '@/app/redux-hooks'
import { resolveTenantLogoUrl } from '@/lib/tenantTheme'
import { cn } from '@/lib/utils'

const DEFAULT_LOGO_SRC = `${process.env.PUBLIC_URL}/images/app-logo.svg`

type AppLogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'header'
}

const sizeMap = { sm: 40, md: 56, lg: 72 }

/**
 * Product logo — shows the tenant's custom logo when a white-label
 * theme is active, otherwise falls back to the default app logo.
 *
 * The tenant logo URL is stored on `document.documentElement.dataset.tenantLogo`
 * by `applyTenantTheme()` in the `TenantValidationGuard`.
 */
export function AppLogo({ className, size = 'md' }: AppLogoProps) {
  const tenantLogo =
    typeof document !== 'undefined' ? document.documentElement.dataset.tenantLogo : undefined
  const tenantName =
    typeof document !== 'undefined' ? document.documentElement.dataset.tenantName : undefined

  const logoSrc = tenantLogo?.trim() || DEFAULT_LOGO_SRC
  const alt = tenantName?.trim() || 'Trade Harmonizer'

  if (size === 'header') {
    return (
      <img
        src={logoSrc}
        alt={alt}
        className={cn('h-9 w-auto max-h-10 shrink-0 object-contain object-left md:h-10', className)}
      />
    )
  }
  const px = sizeMap[size]
  return (
    <img
      src={logoSrc}
      alt={alt}
      width={px}
      height={px}
      className={cn('shrink-0 object-contain object-left', className)}
    />
  )
}
