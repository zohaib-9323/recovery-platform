import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, Mail, X } from 'lucide-react'

import { useGetRecoveryProfileQuery } from '@/app/services/recoveryApi'
import {
  useGetM365ImportJobDetailQuery,
  useGetM365ImportJobItemsQuery,
} from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Button } from '@/components/ui/button'
import type { M365ImportJobFailure } from '@/types/recovery-m365-api'

import { formatShortDateRange } from './date-range-utils'
import { ImportDetailAttachmentsCard } from './import-detail-attachments-card'
import { ImportDetailBanner, ImportDetailStatusBadge, MetricBox } from './import-detail-shared'
import { ImportDetailStaticShipments } from './import-detail-static-shipments'

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['queued', 'running', 'retrying'])
const POLL_MS = 3000
// Flip on once the backend returns processable/in-processing/unprocessable shipment
// data for an import job — the UI is already built in import-detail-static-shipments.
const SHOW_STATIC_SHIPMENT_SECTIONS = false

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatReceived(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

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

/**
 * Shows per-email failures recorded in ImportJob.failures[].
 * These are emails where the attachment LIST call failed (before we even
 * know what files are attached).  Separate from ImportFetchedItem failures.
 */
function FailedTable({ failures }: { failures: M365ImportJobFailure[] }) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-redOne/20">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Failed emails</caption>
        <thead>
          <tr className="border-b border-redOne/20 bg-redOne/5 text-left text-xs text-redOne">
            <th className="px-4 py-3 font-medium">Subject</th>
            <th className="px-4 py-3 font-medium">Attachment</th>
            <th className="px-4 py-3 font-medium">Received</th>
            <th className="px-4 py-3 font-medium">Reason Code</th>
            <th className="px-4 py-3 font-medium">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-redOne/10">
          {failures.map((f, idx) => (
            <tr key={`${f.messageId}-${idx}`} className="hover:bg-redOne/5">
              <td className="px-4 py-3 text-rp-fg" title={f.subject}>
                {truncate(f.subject, 40)}
              </td>
              <td className="px-4 py-3 text-rp-muted">{f.attachmentName ?? '—'}</td>
              <td className="px-4 py-3 text-rp-muted">{formatReceived(f.receivedDateTime)}</td>
              <td className="px-4 py-3 font-mono text-xs text-rp-muted">{f.reason}</td>
              <td className="px-4 py-3 text-redOne" title={f.detail}>
                {truncate(f.detail, 80)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ImportJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pollingInterval, setPollingInterval] = useState(POLL_MS)
  const [itemPage, setItemPage] = useState(1)

  const {
    data: jobData,
    isLoading: isJobLoading,
    isError,
  } = useGetM365ImportJobDetailQuery(id ?? '', {
    pollingInterval,
    skip: !id,
  })
  const { data: profile } = useGetRecoveryProfileQuery()

  const job = jobData?.content
  const isActive = job ? ACTIVE_STATUSES.has(job.status) : true

  // Keep the polling interval in sync with the job's active state. Adjusting state
  // during render (guarded so it only fires when the target actually changes) avoids
  // the extra render + cascading updates a useEffect would cause here.
  const targetPollingInterval = job ? (isActive ? POLL_MS : 0) : POLL_MS
  if (job && pollingInterval !== targetPollingInterval) {
    setPollingInterval(targetPollingInterval)
  }

  const { data: itemsData, isFetching: isItemsFetching } = useGetM365ImportJobItemsQuery(
    { id: id ?? '', page: itemPage, limit: 50 },
    { skip: !id || !job || isActive },
  )

  const passedItems = (itemsData?.content?.items ?? []).filter((i) => i.status !== 'failed')
  const totalItemPages = itemsData?.content?.totalPages ?? 1

  // Failures come from the job document itself (recorded during attachment-download errors),
  // not from importfetcheditems. job.failures is populated by the processor.
  const jobFailures = job?.failures ?? []
  const hasJobFailures = jobFailures.length > 0

  const handleBack = () => {
    navigate('/imports')
  }

  if (isJobLoading) {
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
              {job.folderName} — {rangeLabel}
            </span>
            <ImportDetailStatusBadge status={job.status} />
          </div>

          <div className="flex flex-wrap gap-3">
            <MetricBox value={job.stats.scanned} label="Scanned" />
            <MetricBox value={job.stats.matched} label="Matched" />
            <MetricBox value={job.stats.added} label="Added" />
            <MetricBox value={job.stats.skipped} label="Skipped" />
            <MetricBox value={job.stats.failed} label="Failed" />
          </div>

          {job.status === 'queued' && (
            <ImportDetailBanner tone="blue" icon={AlertTriangle}>
              This job is queued and will start automatically when the previous import finishes.
            </ImportDetailBanner>
          )}
          {job.status === 'running' && (
            <ImportDetailBanner tone="blue" icon={AlertTriangle}>
              Import is running. This page updates automatically — you can leave and come back.
            </ImportDetailBanner>
          )}
          {job.status === 'retrying' && (
            <ImportDetailBanner tone="accent" icon={AlertTriangle}>
              A temporary error occurred. The import will retry shortly.
            </ImportDetailBanner>
          )}
          {isCompleted && (
            <ImportDetailBanner tone="success" icon={Check}>
              {job.stats.failed > 0
                ? `Import complete with ${job.stats.failed} failed attachment(s). ${job.stats.added} emails were added successfully.`
                : `Import complete. ${job.stats.added} emails were added successfully.`}
            </ImportDetailBanner>
          )}
          {hasFailed && (
            <ImportDetailBanner tone="danger" icon={X}>
              <span className="mb-1 block font-semibold">Import failed</span>
              {job.fatalError ?? 'An unexpected error stopped the import. Please try again.'}
            </ImportDetailBanner>
          )}
          {job.status === 'cancelled' && (
            <ImportDetailBanner tone="danger" icon={X}>
              This import was cancelled.
            </ImportDetailBanner>
          )}
        </div>
      </div>

      {/* Attachments */}
      <ImportDetailAttachmentsCard
        jobId={id ?? ''}
        isActive={isActive}
        isLoading={isItemsFetching}
        items={passedItems}
        page={itemPage}
        totalPages={totalItemPages}
        onLoadMore={() => setItemPage((p) => p + 1)}
      />

      {/* Processable / In Processable / Unprocessable Shipments — hidden until the
          backend provides this data; see import-detail-static-shipments.tsx */}
      {SHOW_STATIC_SHIPMENT_SECTIONS && <ImportDetailStaticShipments />}

      {/* Failed emails — errors recorded during attachment-download */}
      {!isActive && hasJobFailures && (
        <section className="flex w-full flex-col gap-3">
          <h2 className="text-lg font-semibold text-redOne">
            Failed Emails ({jobFailures.length}
            {job.failuresCapped ? '+' : ''})
          </h2>
          {job.failuresCapped && (
            <p className="text-xs text-redOne/80">Only the first 500 failures are shown.</p>
          )}
          <FailedTable failures={jobFailures} />
        </section>
      )}
    </div>
  )
}
