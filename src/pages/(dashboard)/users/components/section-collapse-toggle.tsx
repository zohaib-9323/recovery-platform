import { MU } from '@/lib/manage-users-copy'

export type SectionCollapseToggleProps = {
  open: boolean
  onToggle: () => void
  /** Id of the region this toggle controls, for `aria-controls`. */
  controls: string
}

/** Figma: 24px white circle with a #E0E0E0 ring and a chevron. */
export function SectionCollapseToggle({ open, onToggle, controls }: SectionCollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? MU.collapseSection : MU.expandSection}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-bottomBorder bg-white"
    >
      <span
        aria-hidden
        className={`${open ? 'icon-arrow-up' : 'icon-arrow-down'} text-tiny text-black`}
      />
    </button>
  )
}
