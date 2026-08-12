import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

import {
  useGetRecoveryInboxDocumentByIdQuery,
  useGetRecoveryInboxDocumentsQuery,
} from '@/app/services/recoveryApi'
import { useI18n } from '@/i18n/useI18n'
import { mapRecoveryDocumentToInboxEmail } from '@/pages/(dashboard)/inbox/inbox-mappers'
import type { InboxEmail } from '@/pages/(dashboard)/inbox/types'

import { InboxDetailPanel } from './components/inbox-detail-panel'
import { InboxListSidebar } from './components/inbox-list-sidebar'

type InboxRecordFilter = 'all' | 'processed' | 'quarantined'
const PAGE_LIMIT = 10

function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback
  if (!('status' in error)) return fallback
  const data = (error as FetchBaseQueryError & { data?: unknown }).data
  if (!data || typeof data !== 'object') return fallback
  if ('message' in data && typeof data.message === 'string') return data.message
  return fallback
}

export function InboxPage() {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recordFilter, setRecordFilter] = useState<InboxRecordFilter>('all')
  const [page, setPage] = useState(1)
  const [emails, setEmails] = useState<InboxEmail[]>([])

  const queryArgs = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      ...(recordFilter === 'all' ? {} : { recordType: recordFilter }),
    }),
    [page, recordFilter],
  )

  const {
    currentData: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useGetRecoveryInboxDocumentsQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  })

  const handleFilterChange = (value: InboxRecordFilter) => {
    setPage(1)
    setEmails([])
    setRecordFilter(value)
  }

  useEffect(() => {
    const responsePage = listData?.content?.page ?? page
    if (responsePage !== page) return

    const mapped = (listData?.content?.data ?? []).map(mapRecoveryDocumentToInboxEmail)
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return

      if (page === 1) {
        setEmails(mapped)
        return
      }

      setEmails((prev) => {
        const seen = new Set(prev.map((email) => email.id))
        const next = mapped.filter((email) => !seen.has(email.id))
        return [...prev, ...next]
      })
    })

    return () => {
      cancelled = true
    }
  }, [listData, page])

  const totalPages = listData?.content?.totalPages ?? 1
  const effectiveSelectedId = useMemo(() => {
    if (!emails.length) return null
    const hasCurrentSelection = selectedId ? emails.some((email) => email.id === selectedId) : false
    return hasCurrentSelection ? selectedId : emails[0].id
  }, [emails, selectedId])

  const {
    currentData: detailData,
    isFetching: isDetailFetching,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useGetRecoveryInboxDocumentByIdQuery(effectiveSelectedId ?? skipToken, {
    refetchOnMountOrArgChange: true,
  })

  const selected = useMemo<InboxEmail | null>(() => {
    const detailRecord = detailData?.content?.data
    if (detailRecord) return mapRecoveryDocumentToInboxEmail(detailRecord)
    return emails.find((email) => email.id === effectiveSelectedId) ?? null
  }, [detailData, emails, effectiveSelectedId])

  const sidebarError = isListError
    ? getQueryErrorMessage(listError, t('inbox.sidebar.loadError'))
    : null
  const isInitialListLoading = (isListLoading || isListFetching) && page === 1
  const isLoadingMore = isListFetching && page > 1
  const canLoadMore = page < totalPages

  const detailPanelError = isDetailError
    ? getQueryErrorMessage(detailError, t('inbox.detail.loadError'))
    : null

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-bottomBorder bg-white text-[#4B4B4B] lg:flex-row">
        <InboxListSidebar
          emails={emails}
          selectedId={effectiveSelectedId}
          onSelect={setSelectedId}
          isLoading={isInitialListLoading}
          filterValue={recordFilter}
          onFilterChange={handleFilterChange}
          onLoadMore={() => setPage((prev) => prev + 1)}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          errorMessage={sidebarError}
          className="max-h-[50vh] w-full lg:max-h-none lg:w-[min(100%,320px)] lg:shrink-0"
        />
        <InboxDetailPanel
          email={selected}
          isLoading={isDetailFetching}
          errorMessage={detailPanelError}
          onInboxUpdated={async () => {
            await Promise.all([refetchDetail(), refetchList()])
          }}
          className="min-h-0 min-w-0 flex-1"
        />
      </div>
    </div>
  )
}
