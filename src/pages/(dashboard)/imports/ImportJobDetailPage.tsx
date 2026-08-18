import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Mail,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react'

import { useGetRecoveryProfileQuery } from '@/app/services/recoveryApi'
import {
  useGetM365ImportJobDetailQuery,
  useGetM365ImportJobItemsQuery,
  useDownloadM365ImportItemMutation,
} from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  M365FetchedItem,
  M365ImportJobFailure,
  M365ImportJobStatus,
} from '@/types/recovery-m365-api'

import { formatShortDateRange } from './date-range-utils'
import { InfoBanner } from './info-banner'

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set<M365ImportJobStatus>(['queued', 'running', 'retrying'])
const POLL_MS = 3000

const STATUS_BADGE: Record<
  M365ImportJobStatus,
  { label: string; className: string; spin?: boolean; Icon: typeof Clock }
> = {
  queued: {
    label: 'Queued',
    className: 'border border-rp-border bg-rp-surface text-rp-muted',
    Icon: Clock,
  },
  running: {
    label: 'Running',
    className: 'border border-rp-blue bg-rp-blueWithOpacity text-rp-blue',
    spin: true,
    Icon: RefreshCw,
  },
  retrying: {
    label: 'Retrying',
    className: 'border border-rp-accent bg-rp-accent/10 text-rp-accent',
    Icon: AlertTriangle,
  },
  completed: {
    label: 'Completed',
    className: 'border border-rp-success bg-rp-success/10 text-rp-success',
    Icon: CheckCircle2,
  },
  completed_with_errors: {
    label: 'Completed',
    className: 'border border-rp-success bg-rp-success/10 text-rp-success',
    Icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'border border-red-600 bg-red-50 text-red-600',
    Icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border border-rp-border bg-rp-surface text-rp-muted',
    Icon: XCircle,
  },
}

const ITEM_STATUS_CHIP: Record<M365FetchedItem['status'], { label: string; className: string }> = {
  fetched: { label: 'Passed', className: 'text-rp-success' },
  duplicate: { label: 'Duplicate', className: 'text-rp-muted' },
  failed: { label: 'Failed', className: 'text-red-600' },
}

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

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: M365ImportJobStatus }) {
  const cfg = STATUS_BADGE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        cfg.className,
      )}
    >
      <cfg.Icon className={cn('size-3.5 shrink-0', cfg.spin && 'animate-spin')} aria-hidden />
      {cfg.label}
    </span>
  )
}

function StatBox({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[8px] bg-rp-surface p-4">
      <span className="text-2xl font-bold leading-none text-rp-heading">
        {(value ?? 0).toLocaleString()}
      </span>
      <span className="text-xs text-rp-muted">{label}</span>
    </div>
  )
}

/** Attachment name cell — clickable when download is available, plain text otherwise. */
function AttachmentCell({ jobId, item }: { jobId: string; item: M365FetchedItem }) {
  const [downloadItem, { isLoading }] = useDownloadM365ImportItemMutation()
  const [downloadError, setDownloadError] = useState(false)
  const canDownload = Boolean(item.graphAttachmentId || item.s3Key)

  async function handleDownload() {
    setDownloadError(false)
    try {
      const blob = await downloadItem({ jobId, itemId: item.id }).unwrap()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.attachmentName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError(true)
    }
  }

  if (!canDownload) {
    return <span className="text-rp-fg">{item.attachmentName}</span>
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isLoading}
      title={downloadError ? 'Download failed — try again' : `Download ${item.attachmentName}`}
      className={cn(
        'inline-flex items-center gap-1.5 text-left transition-colors disabled:opacity-60',
        downloadError ? 'text-red-500' : 'text-rp-blue hover:underline',
      )}
    >
      {isLoading ? (
        <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Download className="size-3 shrink-0" aria-hidden />
      )}
      {item.attachmentName}
    </button>
  )
}

function DocumentsTable({
  jobId,
  items,
  caption,
}: {
  jobId: string
  items: M365FetchedItem[]
  caption: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rp-border text-left text-xs text-rp-muted">
            <th className="py-3 pr-4 font-medium">Subject</th>
            <th className="py-3 pr-4 font-medium">Attachment</th>
            <th className="py-3 pr-4 font-medium">Size</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 font-medium">Received</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rp-border">
          {items.map((item) => {
            const chip = ITEM_STATUS_CHIP[item.status]
            return (
              <tr key={item.id} className="hover:bg-rp-surface/50">
                <td className="py-3 pr-4 text-rp-fg" title={item.subject}>
                  {truncate(item.subject, 44)}
                </td>
                <td className="py-3 pr-4">
                  <AttachmentCell jobId={jobId} item={item} />
                </td>
                <td className="py-3 pr-4 text-rp-muted">{item.attachmentSizeFormatted}</td>
                <td className={cn('py-3 pr-4 font-medium', chip.className)}>{chip.label}</td>
                <td className="py-3 text-rp-muted">{formatReceived(item.receivedDateTime)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Failed emails</caption>
        <thead>
          <tr className="border-b border-rp-border text-left text-xs text-rp-muted">
            <th className="py-3 pr-4 font-medium">Subject</th>
            <th className="py-3 pr-4 font-medium">Attachment</th>
            <th className="py-3 pr-4 font-medium">Received</th>
            <th className="py-3 pr-4 font-medium">Reason Code</th>
            <th className="py-3 font-medium">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rp-border">
          {failures.map((f, idx) => (
            <tr key={`${f.messageId}-${idx}`} className="hover:bg-rp-surface/50">
              <td className="py-3 pr-4 text-rp-fg" title={f.subject}>
                {truncate(f.subject, 40)}
              </td>
              <td className="py-3 pr-4 text-rp-muted">{f.attachmentName ?? '—'}</td>
              <td className="py-3 pr-4 text-rp-muted">{formatReceived(f.receivedDateTime)}</td>
              <td className="py-3 pr-4 font-mono text-xs text-rp-muted">{f.reason}</td>
              <td className="py-3 text-red-600" title={f.detail}>
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3 sm:p-6">
      {/* Back */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-rp-muted transition-colors hover:text-rp-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Import History
      </button>

      {/* User section */}
      <section className="rounded-[10px] border border-rp-border bg-rp-page p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-rp-heading">
          User Information
        </h2>
        <div className="flex flex-wrap gap-x-12 gap-y-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-rp-muted">Full Name</span>
            <span className="font-semibold text-rp-heading">{userName}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-rp-muted">Email Address</span>
            <span className="font-semibold text-rp-heading">{profile?.content?.email ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-rp-muted" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-rp-muted">Connected Mailbox</span>
              <span className="font-semibold text-rp-heading">{job.mailboxEmail}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Import details */}
      <section className="rounded-[10px] border border-rp-border bg-rp-page p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-rp-heading">
          Import Details
        </h2>

        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-rp-fg">
            {job.folderName} — {rangeLabel}
          </span>
          <StatusBadge status={job.status} />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBox value={job.stats.scanned} label="SCANNED" />
          <StatBox value={job.stats.matched} label="MATCHED" />
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
      </section>

      {/* Documents */}
      <section className="rounded-[10px] border border-rp-border bg-rp-page p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-rp-heading">
          Fetched Documents
        </h2>

        {isActive ? (
          <p className="text-sm text-rp-muted">
            Documents will appear here once the import completes.
          </p>
        ) : isItemsFetching && itemPage === 1 ? (
          <div className="flex justify-center py-6">
            <CustomLoader />
          </div>
        ) : passedItems.length === 0 && !hasJobFailures ? (
          <p className="text-sm text-rp-muted">No documents were fetched in this import.</p>
        ) : (
          <>
            {passedItems.length > 0 && (
              <DocumentsTable
                jobId={id ?? ''}
                items={passedItems}
                caption={`${passedItems.length} fetched documents`}
              />
            )}

            {itemPage < totalItemPages && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isItemsFetching}
                  onClick={() => {
                    setItemPage((p) => p + 1)
                  }}
                >
                  {isItemsFetching ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Failed emails — errors recorded during attachment-download */}
      {!isActive && hasJobFailures && (
        <section className="rounded-[10px] border border-red-200 bg-red-50/40 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-red-700">
            Failed Emails ({jobFailures.length}
            {job.failuresCapped ? '+' : ''})
          </h2>
          {job.failuresCapped && (
            <p className="mb-3 text-xs text-red-500">Only the first 500 failures are shown.</p>
          )}
          <FailedTable failures={jobFailures} />
        </section>
      )}
    </div>
  )
}
