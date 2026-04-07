import { useState } from 'react'

import { inboxEmails } from '@/data/mock/inbox'

import { InboxDetailPanel } from './components/inbox-detail-panel'
import { InboxListSidebar } from './components/inbox-list-sidebar'

export function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(() => inboxEmails[0]?.id ?? null)

  const selected = inboxEmails.find((e) => e.id === selectedId) ?? null

  return (
    <div className="flex min-h-[min(720px,calc(100vh-7rem))] flex-col overflow-hidden rounded-xl border border-rp-border bg-white shadow-sm lg:flex-row">
      <InboxListSidebar
        emails={inboxEmails}
        selectedId={selectedId}
        onSelect={setSelectedId}
        className="max-h-[42vh] w-full lg:max-h-none lg:w-[min(100%,380px)] lg:shrink-0"
      />
      <InboxDetailPanel email={selected} className="min-h-0 min-w-0 flex-1" />
    </div>
  )
}
