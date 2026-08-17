import { type ReactNode } from 'react'
import { Info, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const TONE_CLASSES = {
  blue: 'border-rp-blue bg-rp-blueWithOpacity text-rp-blue',
  accent: 'border-rp-accent bg-rp-accent/10 text-rp-accent',
  success: 'border-rp-success bg-rp-success/10 text-rp-success',
  danger: 'border-red-600 bg-red-50 text-red-600',
} as const

export type InfoBannerTone = keyof typeof TONE_CLASSES

export type InfoBannerProps = {
  children: ReactNode
  tone?: InfoBannerTone
  icon?: LucideIcon
}

export function InfoBanner({ children, tone = 'blue', icon: Icon = Info }: InfoBannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[10px] border-[0.8px] px-3 py-2.5',
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="mt-0.5 size-[17px] shrink-0" aria-hidden />
      <p className="text-xs leading-5">{children}</p>
    </div>
  )
}
