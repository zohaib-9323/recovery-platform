import { cn } from '@/lib/utils'

export type StatusTagProps = {
  /** Tailwind background + text colour pair, e.g. `bg-lightGreenOne text-green`. */
  className: string
  label: string
}

/**
 * Figma "Tag": 6px padding, 5px radius, 4px dot, 5px gap, 16px regular label
 * (matches the Inbox attachment "Passed" status pill).
 * The dot inherits the label colour via `bg-current`.
 */
export function StatusTag({ className, label }: StatusTagProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-[5px] rounded-[5px] p-[6px] text-base font-normal capitalize',
        className,
      )}
    >
      <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  )
}
