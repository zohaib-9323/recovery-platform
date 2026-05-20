import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import { cn } from '@/lib/utils'
import type { InboxEmail } from '@/pages/(dashboard)/inbox/types'
import { useI18n } from '@/i18n/useI18n'

import { InboxEmailListItem } from './inbox-email-list-item'
import { InboxFilterDropdown } from './inbox-filter-dropdown'

export type InboxListSidebarProps = {
  emails: InboxEmail[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  filterValue: 'all' | 'processed' | 'quarantined'
  onFilterChange: (value: 'all' | 'processed' | 'quarantined') => void
  onLoadMore: () => void
  canLoadMore: boolean
  isLoadingMore?: boolean
  errorMessage?: string | null
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
  isLoading = false,
  filterValue,
  onFilterChange,
  onLoadMore,
  canLoadMore,
  isLoadingMore = false,
  errorMessage = null,
  className,
}: InboxListSidebarProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => filterEmails(emails, search), [emails, search])
  let listContent: ReactNode

  if (isLoading) {
    listContent = (
      <p className="px-1 text-sm font-light text-blackFive">{t('inbox.sidebar.loading')}</p>
    )
  } else if (errorMessage) {
    listContent = <p className="px-1 text-sm text-redOne">{errorMessage}</p>
  } else if (filtered.length === 0) {
    listContent = (
      <p className="px-1 text-sm font-light text-blackFive">{t('inbox.sidebar.empty')}</p>
    )
  } else {
    listContent = filtered.map((email) => (
      <InboxEmailListItem
        key={email.id}
        email={email}
        active={selectedId === email.id}
        onSelect={() => onSelect(email.id)}
      />
    ))
  }

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col border-b border-bottomBorder bg-white lg:border-b-0 lg:border-r lg:border-r-bottomBorder',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-bottomBorder px-4 py-3">
        <h2 className="text-base font-semibold text-black">{t('inbox.sidebar.incoming')}</h2>
        <span className="text-sm font-light text-blackFive">
          {filtered.length}{' '}
          {filtered.length === 1 ? t('common.emailCount.one') : t('common.emailCount.other')}
        </span>
      </div>
      <div className="shrink-0 border-b border-bottomBorder p-3">
        <div className="flex flex-col gap-2">
          <ShipmentsSearchInput
            id="inbox-search"
            value={search}
            onChange={setSearch}
            placeholder={t('common.search')}
            className="!max-w-none"
          />
          <InboxFilterDropdown
            value={filterValue}
            onChange={onFilterChange}
            options={[
              { value: 'all', label: t('inbox.filter.all') },
              { value: 'processed', label: t('inbox.filter.processed') },
              { value: 'quarantined', label: t('inbox.filter.quarantined') },
            ]}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">{listContent}</div>
        {canLoadMore ? (
          <div className="pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-bottomBorder"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t('inbox.sidebar.loadingMore') : t('inbox.sidebar.loadMore')}
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
