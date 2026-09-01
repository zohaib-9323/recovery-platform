import { useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react'

import type { M365ImportJobSummary } from '@/types/recovery-m365-api'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

import { formatShortDateRange } from './date-range-utils'
import { formatFolders } from './format-utils'
import { InfoBanner } from './info-banner'

export type ImportJobCardProps = {
  job: M365ImportJobSummary
  onViewDetail?: () => void
  onStartAnother?: () => void
  onRetry?: () => void
  onContactSupport?: () => void
}

const STATUS_BADGE_CLASSES: Record<M365ImportJobSummary['status'], string> = {
  queued: 'border border-rp-border bg-rp-surface text-rp-muted',
  running: 'border border-rp-blue bg-rp-blueWithOpacity text-rp-blue',
  retrying: 'border border-rp-accent bg-rp-accent/10 text-rp-accent',
  // In-progress blue, same as running — pairing is work, not a finished state.
  pairing: 'border border-rp-blue bg-rp-blueWithOpacity text-rp-blue',
  completed: 'border border-rp-green bg-[#2e7d32]/10 text-rp-green',
  completed_with_errors: 'border border-rp-green bg-[#2e7d32]/10 text-rp-green',
  failed: 'border border-red-600 bg-red-50 text-red-600',
  cancelled: 'border border-rp-border bg-rp-surface text-rp-muted',
}

const ACTIVE_STATUSES: ReadonlySet<M365ImportJobSummary['status']> = new Set([
  'queued',
  'running',
  'retrying',
  'pairing',
])

export function isActiveImportJob(job: M365ImportJobSummary): boolean {
  return ACTIVE_STATUSES.has(job.status)
}

function StatusBadge({ job }: { job: M365ImportJobSummary }) {
  const { t } = useI18n()

  // `pairing` must be listed explicitly: the fallback arm is the success tick,
  // so without it an in-progress job renders a green check.
  const Icon =
    job.status === 'queued'
      ? Clock
      : job.status === 'running' || job.status === 'pairing'
        ? RefreshCw
        : job.status === 'retrying'
          ? AlertTriangle
          : job.status === 'failed' || job.status === 'cancelled'
            ? XCircle
            : CheckCircle2

  const label = t(`imports.job.status.${job.status}`)

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
          STATUS_BADGE_CLASSES[job.status],
        )}
      >
        <Icon
          className={cn(
            'size-3.5 shrink-0',
            (job.status === 'running' || job.status === 'pairing') && 'animate-spin',
          )}
        />
        {label}
      </span>
      {job.status === 'completed_with_errors' && (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-rp-accent/10 text-sm font-semibold text-rp-accent">
          !
        </span>
      )}
    </span>
  )
}

function MetricRow({ job }: { job: M365ImportJobSummary }) {
  const { t } = useI18n()
  const metrics: Array<{ key: keyof M365ImportJobSummary['stats']; labelKey: string }> = [
    { key: 'scanned', labelKey: 'imports.job.metrics.scanned' },
    { key: 'matched', labelKey: 'imports.job.metrics.matched' },
    { key: 'unmatched', labelKey: 'imports.job.metrics.unmatched' },
    { key: 'added', labelKey: 'imports.job.metrics.added' },
    { key: 'skipped', labelKey: 'imports.job.metrics.skipped' },
    { key: 'failed', labelKey: 'imports.job.metrics.failed' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      {metrics.map(({ key, labelKey }) => (
        <div key={key} className="flex flex-col gap-2 rounded-[8px] bg-rp-surface p-4">
          <span className="text-2xl font-bold leading-none text-rp-heading">
            {(job.stats[key] ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-rp-muted">{t(labelKey)}</span>
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ percent, tone }: { percent: number; tone: 'blue' | 'accent' }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-rp-border">
      <div
        className={cn('h-full rounded-full', tone === 'blue' ? 'bg-rp-blue' : 'bg-rp-accent')}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

function ExpandableSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-[8px] border border-rp-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-[8px] bg-rp-surface p-4 text-left"
      >
        <span className="text-sm font-semibold text-rp-fg">{title}</span>
        {open ? (
          <ChevronUp className="size-4 text-rp-muted" aria-hidden />
        ) : (
          <ChevronDown className="size-4 text-rp-muted" aria-hidden />
        )}
      </button>
      {open && <div className="divide-y divide-rp-border">{children}</div>}
    </div>
  )
}

export function ImportJobCard({
  job,
  onViewDetail,
  onStartAnother,
  onRetry,
  onContactSupport,
}: ImportJobCardProps) {
  const { t } = useI18n()
  const hasFailures = job.status === 'completed_with_errors' || job.stats.failed > 0
  const isCompleted = job.status === 'completed' || job.status === 'completed_with_errors'
  const isActive =
    job.status === 'queued' ||
    job.status === 'running' ||
    job.status === 'retrying' ||
    job.status === 'pairing'

  const progressPercent =
    job.stats.totalDiscovered && job.stats.totalDiscovered > 0
      ? Math.round((job.stats.scanned / job.stats.totalDiscovered) * 100)
      : null
  const progressLabel =
    progressPercent !== null
      ? t('imports.job.scannedOf', {
          scanned: job.stats.scanned.toLocaleString(),
          total: job.stats.totalDiscovered?.toLocaleString() ?? '',
        })
      : t('imports.job.etaCalculating')

  const rangeLabel = formatShortDateRange(new Date(job.dateRangeStart), new Date(job.dateRangeEnd))

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-rp-border bg-rp-page p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-rp-fg">
          {formatFolders(job.folders, job.folderName)} - {rangeLabel}
        </span>
        <div className="flex items-center gap-3">
          <StatusBadge job={job} />
        </div>
      </div>

      <MetricRow job={job} />

      {isActive && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-rp-muted">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {progressLabel}
          </div>
          {progressPercent !== null && (
            <ProgressBar
              percent={progressPercent}
              tone={job.status === 'running' ? 'blue' : 'accent'}
            />
          )}
        </div>
      )}

      {job.status === 'queued' && (
        <InfoBanner tone="blue">{t('imports.job.queuedNotice')}</InfoBanner>
      )}

      {job.status === 'running' && (
        <InfoBanner tone="blue">{t('imports.job.canLeavePage')}</InfoBanner>
      )}

      {job.status === 'retrying' && (
        <InfoBanner tone="accent" icon={AlertTriangle}>
          {t('imports.job.retryingNotice')}
        </InfoBanner>
      )}

      {isCompleted && (
        <InfoBanner tone="success" icon={Check}>
          {hasFailures
            ? t('imports.job.completedWithFailuresNotice', {
                added: job.stats.added.toLocaleString(),
                failedCount: job.stats.failed,
              })
            : t('imports.job.completedNotice', { count: job.stats.added.toLocaleString() })}
        </InfoBanner>
      )}

      {job.status === 'failed' && (
        <div className="flex flex-col gap-4">
          <InfoBanner tone="danger" icon={X}>
            <span className="mb-1 block font-semibold">{t('imports.job.failedTitle')}</span>
            {job.fatalError ?? t('imports.job.failedNotice')}
          </InfoBanner>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-rp-fg">{t('imports.job.whatNext')}</p>
            <p className="text-sm text-rp-muted">{t('imports.job.whatNextDetail')}</p>
          </div>
        </div>
      )}

      {job.status === 'cancelled' && (
        <InfoBanner tone="danger" icon={X}>
          {t('imports.job.cancelledNotice')}
        </InfoBanner>
      )}

      {hasFailures && (
        <ExpandableSection
          title={t('imports.job.unprocessableTitle', { count: job.stats.failed })}
          defaultOpen={false}
        >
          <div className="p-4 text-sm text-rp-muted">{t('imports.job.unprocessableHint')}</div>
        </ExpandableSection>
      )}

      {isCompleted && (
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onViewDetail}>
            {t('imports.job.details')}
          </Button>
          <Button variant="default" size="sm" onClick={onStartAnother}>
            {t('imports.job.startAnother')}
          </Button>
        </div>
      )}

      {job.status === 'failed' && (
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" onClick={onRetry}>
            {t('imports.job.retryImport')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onContactSupport}>
            {t('imports.job.contactSupport')}
          </Button>
        </div>
      )}

      {job.status === 'cancelled' && (
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" onClick={onStartAnother}>
            {t('imports.job.startAnother')}
          </Button>
        </div>
      )}
    </div>
  )
}
