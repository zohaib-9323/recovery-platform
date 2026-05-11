import { ChevronRight, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type ActionCardProps = {
  title: string
  description: string
  icon: LucideIcon
  onClick?: () => void
  className?: string
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  className,
}: ActionCardProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border border-rp-border bg-rp-bg p-4 text-left shadow-sm transition-colors',
        onClick && 'hover:border-rp-accent/40 hover:bg-rp-surface/80',
        className,
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rp-accent/10 text-rp-icon">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-rp-fg">{title}</span>
        <span className="mt-0.5 block text-sm text-rp-muted">{description}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-rp-muted" aria-hidden />
    </Comp>
  )
}
