import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type TableFooterProps = HTMLAttributes<HTMLDivElement>

/** Footer region below the table (e.g. pagination). */
export function TableFooter({ className, children, ...props }: TableFooterProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  )
}
