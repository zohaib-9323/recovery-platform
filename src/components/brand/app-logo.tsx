import { cn } from '@/lib/utils'
import { t } from '@/i18n/useI18n'

const LOGO_SRC = `${process.env.PUBLIC_URL}/images/app-logo.svg`

type AppLogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'header'
}

const sizeMap = { sm: 40, md: 56, lg: 72 }

/** Product logo from `public/images/app-logo.svg` */
export function AppLogo({ className, size = 'md' }: AppLogoProps) {
  if (size === 'header') {
    return (
      <img
        src={LOGO_SRC}
        alt={t('layout.brand')}
        className={cn('h-9 w-auto max-h-10 shrink-0 object-contain object-left md:h-10', className)}
      />
    )
  }
  const px = sizeMap[size]
  return (
    <img
      src={LOGO_SRC}
      alt={t('layout.brand')}
      width={px}
      height={px}
      className={cn('shrink-0 object-contain object-left', className)}
    />
  )
}
