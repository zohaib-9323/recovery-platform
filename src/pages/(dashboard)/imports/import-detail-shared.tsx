import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { M365ImportJobStatus } from '@/types/recovery-m365-api'

// ── Status badge (pill) ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  M365ImportJobStatus,
  { label: string; className: string; spin?: boolean; Icon: LucideIcon }
> = {
  queued: {
    label: 'Queued',
    className: 'border-rp-border bg-rp-surface text-rp-muted',
    Icon: Clock,
  },
  running: {
    label: 'Running',
    className: 'border-rp-blue bg-rp-blue/10 text-rp-blue',
    spin: true,
    Icon: RefreshCw,
  },
  retrying: {
    label: 'Retrying',
    className: 'border-rp-accent bg-rp-accent/10 text-rp-accent',
    Icon: AlertTriangle,
  },
  completed: {
    label: 'Completed',
    className: 'border-rp-green bg-[#2e7d32]/10 text-rp-green',
    Icon: CheckCircle2,
  },
  completed_with_errors: {
    label: 'Completed',
    className: 'border-rp-green bg-[#2e7d32]/10 text-rp-green',
    Icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'border-redOne bg-redOne/10 text-redOne',
    Icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-rp-border bg-rp-surface text-rp-muted',
    Icon: XCircle,
  },
}

export function ImportDetailStatusBadge({ status }: { status: M365ImportJobStatus }) {
  const cfg = STATUS_BADGE[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
        cfg.className,
      )}
    >
      <cfg.Icon className={cn('size-3.5 shrink-0', cfg.spin && 'animate-spin')} aria-hidden />
      {cfg.label}
    </span>
  )
}

// ── Metric row ────────────────────────────────────────────────────────────────

export function MetricBox({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-[8px] border border-rp-border bg-rp-surface p-4">
      <span className="text-2xl font-bold leading-none text-rp-heading">
        {(value ?? 0).toLocaleString()}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-rp-muted">{label}</span>
    </div>
  )
}

// ── Banner ────────────────────────────────────────────────────────────────────

const BANNER_TONE_CLASSES = {
  blue: 'border-rp-blue bg-rp-blue/10 text-rp-blue',
  accent: 'border-rp-accent bg-rp-accent/10 text-rp-accent',
  success: 'border-rp-green bg-[#2e7d32]/10 text-rp-green',
  danger: 'border-redOne bg-redOne/10 text-redOne',
} as const

export type ImportDetailBannerTone = keyof typeof BANNER_TONE_CLASSES

export function ImportDetailBanner({
  tone,
  icon: Icon,
  children,
}: {
  tone: ImportDetailBannerTone
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-[8px] border px-3 py-3',
        BANNER_TONE_CLASSES[tone],
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <p className="text-[13px] leading-normal">{children}</p>
    </div>
  )
}
