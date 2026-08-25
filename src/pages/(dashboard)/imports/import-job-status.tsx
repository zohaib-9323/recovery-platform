import { AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { M365ImportJobFailure, M365ImportJobStatus } from '@/types/recovery-m365-api'

import { formatReceived, truncate } from './format-utils'

// ── Constants ──────────────────────────────────────────────────────────────────

/** Statuses that mean the job is still in progress (used to gate the items query / UI copy). */
export const ACTIVE_STATUSES = new Set<M365ImportJobStatus>(['queued', 'running', 'retrying'])

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
    className: 'border border-rp-green bg-[#2e7d32]/10 text-rp-green',
    Icon: CheckCircle2,
  },
  completed_with_errors: {
    label: 'Completed',
    className: 'border border-rp-green bg-[#2e7d32]/10 text-rp-green',
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

/** Maps the backend ImportFailureReason enum codes to readable copy. */
const FAILURE_REASON_LABEL: Record<string, string> = {
  attachment_too_large: 'Attachment too large',
  attachment_format_unsupported: 'Unsupported file format',
  graph_api_unavailable: 'Microsoft Graph unavailable',
  token_expired: 'Mailbox token expired',
  pipeline_classification_failed: 'Classification failed',
  pipeline_storage_failed: 'Storage upload failed',
  duplicate_skipped: 'Already processed (duplicate)',
  unknown: 'Unknown error',
}

function reasonLabel(code: string): string {
  return FAILURE_REASON_LABEL[code] ?? code
}

// ── Status + stat components ────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: M365ImportJobStatus }) {
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

export function StatBox({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[8px] bg-rp-surface p-4">
      <span className="text-2xl font-bold leading-none text-rp-heading">
        {(value ?? 0).toLocaleString()}
      </span>
      <span className="text-xs text-rp-muted">{label}</span>
    </div>
  )
}

/**
 * Shows per-email failures recorded in ImportJob.failures[].
 * These are emails where the attachment LIST call failed (before we even
 * know what files are attached).  Separate from ImportFetchedItem failures.
 */
export function FailedTable({ failures }: { failures: M365ImportJobFailure[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <caption className="sr-only">Failed emails</caption>
        <thead>
          <tr className="border-b border-rp-border text-left text-xs text-rp-muted">
            <th className="py-3 pr-4 font-medium">Subject</th>
            <th className="py-3 pr-4 font-medium">Attachment</th>
            <th className="py-3 pr-4 font-medium">Received</th>
            <th className="py-3 pr-4 font-medium">Reason</th>
            <th className="py-3 pr-4 font-medium">Detail</th>
            <th className="py-3 pr-4 font-medium text-right">Attempts</th>
            <th className="py-3 font-medium">Last Attempt</th>
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
              <td className="py-3 pr-4">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {reasonLabel(f.reason)}
                </span>
              </td>
              <td className="max-w-[220px] py-3 pr-4 text-red-600" title={f.detail}>
                {truncate(f.detail, 80)}
              </td>
              <td className="py-3 pr-4 text-right tabular-nums text-rp-muted">
                {f.attemptCount ?? 1}
              </td>
              <td className="py-3 text-rp-muted">
                {f.lastAttemptAt ? formatReceived(f.lastAttemptAt) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
