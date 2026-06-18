import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>

// i18n-ignore-next-line
/** `<thead>` with dashboard column styling. Pass `<tr><th>…</th></tr>` as children. */
export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('bg-[#F1F1F1] text-xs font-semibold text-rp-fg', className)} {...props}>
      {children}
    </thead>
  )
}
