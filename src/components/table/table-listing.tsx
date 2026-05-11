import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type TableListingProps = HTMLAttributes<HTMLTableSectionElement>

// i18n-ignore-next-line
/** `<tbody>` with row dividers. Pass `<tr>…</tr>` rows as children. */
export function TableListing({ className, children, ...props }: TableListingProps) {
  return (
    <tbody className={cn('divide-y divide-rp-border', className)} {...props}>
      {children}
    </tbody>
  )
}
