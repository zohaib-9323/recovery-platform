import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { MU } from '@/lib/manage-users-copy'
import { userStatusFilterOptions, type UserStatusFilter } from '@/lib/manage-users-table-helper'
import { cn } from '@/lib/utils'

export type UserStatusFilterProps = {
  value: UserStatusFilter
  onChange: (value: UserStatusFilter) => void
}

/**
 * Figma "Button listbox": 150×36, 6px radius, #E0E0E0 border with a 0.6px
 * #E3E3E3 outer ring, 14px light placeholder in #929292 and a 16px chevron.
 */
export function UserStatusFilter({ value, onChange }: UserStatusFilterProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = userStatusFilterOptions.find((option) => option.value === value)
  const isPlaceholder = value === 'all'

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id="user-status-filter"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-[150px] items-center justify-between rounded-[6px] border border-bottomBorder bg-transparent pl-3 pr-3 shadow-[0px_0px_0px_0.6px_#E3E3E3]"
      >
        <span
          className={cn(
            'truncate text-xsmall font-light leading-5',
            isPlaceholder ? 'text-[#929292]' : 'text-black',
          )}
        >
          {isPlaceholder ? MU.selectStatus : selected?.label}
        </span>
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-[#929292]" />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby="user-status-filter"
          className="absolute right-0 z-30 mt-1 w-[150px] overflow-hidden rounded-[6px] border border-bottomBorder bg-white py-1 shadow-[0px_1px_10px_0px_#00000024]"
        >
          {userStatusFilterOptions.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-xsmall font-light hover:bg-greyFour',
                  option.value === value ? 'text-yellow' : 'text-black',
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
