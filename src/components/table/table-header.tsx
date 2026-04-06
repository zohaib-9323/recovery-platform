import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>

/** `<thead>` with dashboard column styling. Pass `<tr><th>…</th></tr>` as children. */
export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn(
        'bg-rp-surface/80 text-xs font-semibold uppercase tracking-wide text-rp-muted',
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  )
}
