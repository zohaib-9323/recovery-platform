import { FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { InboxEmail } from '@/data/mock/inbox'

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
          ? 'border-rp-accent bg-lightYellowThree/50 shadow-sm'
          : 'border-rp-border bg-white hover:border-rp-border hover:bg-rp-surface/60',
      )}
    >
      <p className="font-semibold text-rp-fg">{email.sender}</p>
      <p className="mt-1 line-clamp-2 text-sm text-rp-fg">{email.subject}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-rp-muted">{email.receivedLabel}</span>
        {email.fileCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-rp-surface px-2 py-0.5 text-xxtiny font-medium text-rp-muted">
            <FileText className="h-3 w-3 shrink-0" aria-hidden />
            {email.fileCount} {email.fileCount === 1 ? 'file' : 'files'}
          </span>
        ) : null}
      </div>
    </button>
  )
}
