import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

export type ShipmentsSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

/** Search field with magnifying glass on the right. */
export function ShipmentsSearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
  id = 'shipments-search',
}: ShipmentsSearchInputProps) {
  return (
    <div className={cn('relative w-full min-w-0 sm:max-w-md', className)}>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 w-full rounded-[10px] border border-rp-border bg-rp-input px-3 py-2 pr-10 text-sm text-rp-fg placeholder:text-rp-disabled focus:outline-none focus:ring-2 focus:ring-rp-accent focus:ring-offset-2 focus:ring-offset-rp-bg"
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 text-rp-muted"
        aria-hidden
      >
        <Search className="h-5 w-5" strokeWidth={2} />
      </span>
    </div>
  )
}
