import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, Mail, X } from 'lucide-react'

import { useGetRecoveryProfileQuery } from '@/app/services/recoveryApi'
import {
  useGetM365ImportJobDetailQuery,
  useGetM365ImportJobItemsQuery,
} from '@/app/services/recoveryM365Api'
import { useImportRealtimeRefresh } from '@/app/hooks/useImportRealtimeRefresh'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Button } from '@/components/ui/button'
import type { M365EmailGroup } from '@/types/recovery-m365-api'

import { formatShortDateRange } from './date-range-utils'
import { ImportDetailShipments } from './import-detail-shipments'
import { ImportDocumentsBrowser } from './import-documents-browser'
import { ACTIVE_STATUSES, FailedTable, StatBox, StatusBadge } from './import-job-status'
import { InfoBanner } from './info-banner'
import { formatFolders } from './format-utils'

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR = `${process.env.PUBLIC_URL}/images/no-profile.png`

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-rp-muted">{label}</span>
      <span className="text-sm font-semibold text-rp-heading">{value}</span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ImportJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  // itemPage drives which API page is fetched; allGroups accumulates every loaded email group.
  const [itemPage, setItemPage] = useState(1)
  const [allGroups, setAllGroups] = useState<M365EmailGroup[]>([])
  // Tracks whether this visit's job fetch has been dispatched yet — see showJobLoader below.
  const [hasStartedJobFetch, setHasStartedJobFetch] = useState(false)

  // Reset accumulated groups whenever the user navigates to a different job. Adjusting
  // state during render (guarded by comparing against the previous id) avoids the
  // extra render + cascading updates a useEffect would cause here.
  const [prevId, setPrevId] = useState(id)
  if (id !== prevId) {
    setPrevId(id)
    setAllGroups([])
    setItemPage(1)
    setHasStartedJobFetch(false)
  }

  const {
    data: jobData,
    isFetching: isJobFetching,
    isError,
    refetch: refetchJobDetail,
  } = useGetM365ImportJobDetailQuery(id ?? '', {
    skip: !id,
    // Always hit the API when the page is (re)opened instead of showing the
    // cached job from a previous visit.
    refetchOnMountOrArgChange: true,
  })
  const { data: profile } = useGetRecoveryProfileQuery()

  const job = jobData?.content
  const isActive = job ? ACTIVE_STATUSES.has(job.status) : true

  // No polling: this only refetches when a push notification about this job's status
  // change arrives (see useImportRealtimeRefresh) — either via Firebase's foreground
  // onMessage (useFCM) or the service worker relaying a background push. Those
  // background refreshes are flagged so they update the page in place instead of
  // replacing it with the full-page loader.
  const [isRealtimeRefreshing, setIsRealtimeRefreshing] = useState(false)
  const handleRealtimeRefresh = useCallback(() => {
    setIsRealtimeRefreshing(true)
    void Promise.resolve(refetchJobDetail()).finally(() => setIsRealtimeRefreshing(false))
  }, [refetchJobDetail])
  useImportRealtimeRefresh(handleRealtimeRefresh, Boolean(id))

  // Show the loader on every visit, not only the first. On a revisit RTK Query serves the
  // cached job on the first render (isFetching is still false until the mount refetch is
  // dispatched in an effect), so waiting on isFetching alone would flash stale content.
  if (isJobFetching && !hasStartedJobFetch) {
    setHasStartedJobFetch(true)
  }
  const showJobLoader =
    Boolean(id) && !isRealtimeRefreshing && (!hasStartedJobFetch || isJobFetching)

  const { data: itemsData, isFetching: isItemsFetching } = useGetM365ImportJobItemsQuery(
    { id: id ?? '', page: itemPage, limit: 6 },
    { skip: !id || !job || isActive, refetchOnMountOrArgChange: true },
  )

  const totalItemPages = itemsData?.content?.totalPages ?? 1

  // Append new email groups from each API page, deduplicating by messageId. Adjusting
  // state during render (guarded by comparing against the previous itemsData reference)
  // avoids the extra render + cascading updates a useEffect would cause here.
  // Seeded with undefined rather than itemsData: on a revisit RTK Query already has the
  // page in cache, so itemsData is non-null on the very first render — seeding with it
  // would make the guard below never fire and leave the documents list empty.
  const [prevItemsData, setPrevItemsData] = useState<typeof itemsData>(undefined)
  if (itemsData !== prevItemsData) {
    setPrevItemsData(itemsData)
    const incoming = itemsData?.content?.items
    if (incoming) {
      setAllGroups((prev) => {
        const seen = new Set(prev.map((g) => g.messageId))
        const fresh = incoming.filter((g) => !seen.has(g.messageId))
        return fresh.length > 0 ? [...prev, ...fresh] : prev
      })
    }
  }

  // Failures come from the job document itself (recorded during attachment-download errors),
  // not from importfetcheditems. job.failures is populated by the processor.
  const jobFailures = job?.failures ?? []
  const hasJobFailures = jobFailures.length > 0

  const handleBack = () => {
    navigate('/imports')
  }

  if (showJobLoader) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <CustomLoader />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-rp-muted">Import job not found.</p>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          ← Back to Import History
        </Button>
      </div>
    )
  }

  const isCompleted = job.status === 'completed' || job.status === 'completed_with_errors'
  const hasFailed = job.status === 'failed'
  const rangeLabel = formatShortDateRange(new Date(job.dateRangeStart), new Date(job.dateRangeEnd))
  const userName =
    [profile?.content?.firstName, profile?.content?.lastName].filter(Boolean).join(' ') ||
    'Recovery User'
  const location = [profile?.content?.city, profile?.content?.country].filter(Boolean).join(', ')
  const profilePic = profile?.content?.profilePic

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3 sm:p-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to Import History"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-rp-border bg-rp-page transition-colors hover:bg-rp-surface"
        >
          <ArrowLeft className="size-4 text-rp-fg" aria-hidden />
        </button>
        <span className="text-lg font-semibold text-rp-heading">{userName}</span>
      </div>

      {/* User section */}
      <section className="flex flex-col gap-4 rounded-[10px] border border-rp-border bg-rp-page p-5 shadow-sm">
        <div className="flex size-[60px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-rp-surface">
          <img
            key={profilePic || DEFAULT_AVATAR}
            src={profilePic || DEFAULT_AVATAR}
            alt=""
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR
            }}
          />
        </div>
        <h2 className="text-lg font-semibold text-rp-heading">User Information</h2>
        <div className="flex flex-wrap gap-x-12 gap-y-3 text-sm">
          <InfoField label="Full Name" value={userName} />
          <InfoField label="Phone Number" value={profile?.content?.phone || '—'} />
          <InfoField label="Email Address" value={profile?.content?.email ?? '—'} />
          <InfoField label="Location" value={location || '—'} />
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-rp-muted" aria-hidden />
            <InfoField label="Connected Mailbox" value={job.mailboxEmail} />
          </div>
        </div>
      </section>

      {/* Import details */}
      <div className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold text-rp-heading">Import Details</h2>

        <div className="flex w-full flex-col gap-4 rounded-[10px] border border-rp-border bg-rp-page p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-rp-fg">
              {formatFolders(job.folders, job.folderName)} — {rangeLabel}
            </span>
            <StatusBadge status={job.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatBox value={job.stats.scanned} label="SCANNED" />
            <StatBox value={job.stats.matched} label="MATCHED" />
            <StatBox value={job.stats.unmatched} label="UNMATCHED" />
            <StatBox value={job.stats.added} label="ADDED" />
            <StatBox value={job.stats.skipped} label="SKIPPED" />
            <StatBox value={job.stats.failed} label="FAILED" />
          </div>

          {job.status === 'queued' && (
            <InfoBanner tone="blue">
              This job is queued and will start automatically when the previous import finishes.
            </InfoBanner>
          )}
          {job.status === 'running' && (
            <InfoBanner tone="blue">
              Import is running. This page updates automatically — you can leave and come back.
            </InfoBanner>
          )}
          {job.status === 'retrying' && (
            <InfoBanner tone="accent" icon={AlertTriangle}>
              A temporary error occurred. The import will retry shortly.
            </InfoBanner>
          )}
          {job.status === 'pairing' && (
            <InfoBanner tone="blue">
              All {job.stats.added} email(s) imported. Matching C88s to their invoices — shipments
              and documents will appear here shortly. This page updates automatically.
            </InfoBanner>
          )}
          {isCompleted && (
            <InfoBanner tone="success" icon={Check}>
              {job.stats.failed > 0
                ? `Import complete with ${job.stats.failed} failed attachment(s). ${job.stats.added} emails were added successfully.`
                : `Import complete. ${job.stats.added} emails were added successfully.`}
            </InfoBanner>
          )}
          {hasFailed && (
            <InfoBanner tone="danger" icon={X}>
              <span className="mb-1 block font-semibold">Import failed</span>
              {job.fatalError ?? 'An unexpected error stopped the import. Please try again.'}
            </InfoBanner>
          )}
          {job.status === 'cancelled' && (
            <InfoBanner tone="danger" icon={X}>
              This import was cancelled.
            </InfoBanner>
          )}
        </div>
      </div>

      {/* Documents */}
      <section className="rounded-[10px] border border-rp-border bg-rp-page p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-rp-heading">
          Fetched Emails
        </h2>

        {isActive ? (
          <p className="text-sm text-rp-muted">
            Documents will appear here once the import completes.
          </p>
        ) : isItemsFetching && allGroups.length === 0 ? (
          <div className="flex justify-center py-6">
            <CustomLoader />
          </div>
        ) : allGroups.length === 0 && !hasJobFailures ? (
          <p className="text-sm text-rp-muted">No documents were fetched in this import.</p>
        ) : allGroups.length > 0 ? (
          <ImportDocumentsBrowser
            jobId={id ?? ''}
            groups={allGroups}
            hasMore={itemPage < totalItemPages}
            isLoadingMore={isItemsFetching}
            onLoadMore={() => setItemPage((p) => p + 1)}
          />
        ) : null}
      </section>

      {/* Processable / In Processing / Unprocessable Shipments, unified across
          every email in this import — see import-detail-shipments.tsx for why
          one fetch is enough. */}
      <ImportDetailShipments jobId={id ?? ''} isJobActive={isActive} />

      {/* Per-email processing failures recorded by the import worker */}
      {!isActive && hasJobFailures && (
        <section className="rounded-[10px] border border-red-200 bg-red-50/40 p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-red-700">
                Processing Failures ({jobFailures.length}
                {job.failuresCapped ? '+' : ''})
              </h2>
              <p className="mt-1 text-xs text-red-500">
                These emails could not be processed — their attachments were never fetched.
                {job.failuresCapped && ' Only the first 500 failures are shown.'}
              </p>
            </div>
          </div>
          <FailedTable failures={jobFailures} />
        </section>
      )}
    </div>
  )
}
