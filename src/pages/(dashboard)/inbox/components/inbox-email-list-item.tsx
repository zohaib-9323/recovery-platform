import { cn } from '@/lib/utils'
import type { InboxEmail } from '@/pages/(dashboard)/inbox/types'

export type InboxEmailListItemProps = {
  email: InboxEmail
  active: boolean
  onSelect: () => void
}

export function InboxEmailListItem({ email, active, onSelect }: InboxEmailListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-colors',
        active
          ? 'border-yellow bg-lightYellowThree shadow-[0_0_0_1px_rgba(227,166,2,0.25)]'
          : 'border-bottomBorder bg-white hover:bg-[var(--hover-color)]',
      )}
    >
      <p className="truncate text-sm font-medium text-black" title={email.sender}>
        {email.sender}
      </p>
      <p
        className="mt-1 line-clamp-2 text-sm font-light leading-[140%] text-blackFive"
        title={email.subject}
      >
        {email.subject}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-light text-blackFive">{email.receivedLabel}</span>
        {email.fileCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-bottomBorder px-2 py-0.5 text-xs font-normal text-blackFive">
            <span className="icon-File-text text-xs" aria-hidden />
            {email.fileCount} {email.fileCount === 1 ? 'File' : 'Files'}
          </span>
        ) : null}
      </div>
    </button>
  )
}
