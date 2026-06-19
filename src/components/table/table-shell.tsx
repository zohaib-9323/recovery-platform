import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type TableShellProps = HTMLAttributes<HTMLDivElement> & {
  /** Tailwind min-width for the table (default matches shipments grid). */
  tableMinWidthClassName?: string
}

/** Scroll container + `<table>` wrapper. Place `TableHeader` and `TableListing` inside. */
export function TableShell({
  className,
  tableMinWidthClassName = 'min-w-[980px]',
  children,
  ...props
}: TableShellProps) {
  return (
    <div className={cn('no-scrollbar w-full overflow-x-auto', className)} {...props}>
      <table className={cn('w-full text-left text-sm', tableMinWidthClassName)}>{children}</table>
    </div>
  )
}
