import { useMemo, useState } from 'react'

import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import { cn } from '@/lib/utils'
import type { InboxEmail } from '@/data/mock/inbox'
import { useI18n } from '@/i18n/useI18n'

import { InboxEmailListItem } from './inbox-email-list-item'

export type InboxListSidebarProps = {
  emails: InboxEmail[]
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

function filterEmails(emails: InboxEmail[], query: string): InboxEmail[] {
  const q = query.trim().toLowerCase()
  if (!q) return emails
  return emails.filter(
    (e) =>
      e.sender.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.fromAddress.toLowerCase().includes(q),
  )
}

export function InboxListSidebar({
  emails,
  selectedId,
  onSelect,
  className,
}: InboxListSidebarProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => filterEmails(emails, search), [emails, search])

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col border-b border-rp-border bg-rp-surface lg:border-b-0 lg:border-r',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rp-border px-4 py-3">
        <h2 className="text-sm font-semibold text-rp-fg">{t('inbox.sidebar.incoming')}</h2>
        <span className="text-xs text-rp-muted">
          {filtered.length}{' '}
          {filtered.length === 1 ? t('common.emailCount.one') : t('common.emailCount.other')}
        </span>
      </div>
      <div className="shrink-0 border-b border-rp-border p-3">
        <ShipmentsSearchInput
          id="inbox-search"
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
          className="!max-w-none"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="px-1 text-sm text-rp-muted">{t('inbox.sidebar.empty')}</p>
        ) : (
          filtered.map((email) => (
            <InboxEmailListItem
              key={email.id}
              email={email}
              active={selectedId === email.id}
              onSelect={() => onSelect(email.id)}
            />
          ))
        )}
      </div>
    </aside>
  )
}
