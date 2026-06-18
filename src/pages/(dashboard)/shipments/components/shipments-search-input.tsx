import { useRef, type ChangeEvent } from 'react'

import { MS } from '@/lib/manage-shipments-copy'
import { cn } from '@/lib/utils'

export type ShipmentsSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  padding?: string
  inputWidthClass?: string
}

/** Matches trade-harmonizer `SearchBar` used on Manage Shipments. */
export function ShipmentsSearchInput({
  value,
  onChange,
  placeholder = MS.searchDot,
  className = '',
  id = 'shipments-search',
  padding = 'py-2',
  inputWidthClass,
}: ShipmentsSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleClearSearch = () => {
    onChange('')
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <div className={cn('relative max-w-sm flex-grow', className)}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(
          inputWidthClass ?? 'w-full',
          'pl-3 pr-8',
          padding,
          'rounded border border-searchBorder text-sm font-light text-black placeholder:text-lightGreyThree focus:outline-none',
        )}
        aria-label={MS.searchDot}
      />

      <div
        onClick={handleClearSearch}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClearSearch()
          }
        }}
        role="button"
        tabIndex={0}
        className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-black"
        aria-label={value ? 'Clear search' : 'Search icon'}
      >
        <span className={`${value ? 'icon-close' : 'icon-Search'} text-sm text-black`} />
      </div>
    </div>
  )
}
