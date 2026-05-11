import { cva, type VariantProps } from 'class-variance-authority'

import type { KpiStat } from '@/data/mock/dashboard'
import { cn } from '@/lib/utils'

const statCardVariants = cva(
  'rounded-2xl border border-bottomBorder bg-white p-5 transition-colors hover:bg-[var(--hover-color)]',
  {
    variants: {
      density: {
        default: '',
        compact: 'p-4',
      },
    },
    defaultVariants: {
      density: 'default',
    },
  },
)

export type StatCardProps = Omit<KpiStat, 'id'> &
  VariantProps<typeof statCardVariants> & {
    className?: string
  }

/** Dark green for positive trend / status copy (reference UI). */
const trendUpClass = 'text-emerald-800'

const ARROW_RISE_SRC = `${process.env.PUBLIC_URL}/images/ArrowRise.svg`
const ARROW_DOWN_SRC = `${process.env.PUBLIC_URL}/images/ArrowDown.svg`

export function StatCard({
  label,
  value,
  hint,
  trend,
  hintTone,
  density,
  className,
}: StatCardProps) {
  const isStatus = hintTone === 'success' && trend === 'none'
  const isTrendUp = trend === 'up'
  const isTrendDown = trend === 'down'

  const statusText = hint.replace(/^•\s*/, '').trim()

  return (
    <div className={cn(statCardVariants({ density }), className)}>
      <div className="mb-2 text-xs font-semibold text-black">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 text-3xl font-bold tabular-nums tracking-tight text-black">
          {value}
        </div>

        {isStatus ? (
          <div className="flex max-w-[55%] shrink-0 flex-col items-end">
            <div
              className={cn(
                'flex items-center justify-end gap-1.5 text-xs font-normal',
                trendUpClass,
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-hidden />
              <span className="text-right">{statusText}</span>
            </div>
          </div>
        ) : null}

        {isTrendUp ? (
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <img
              src={ARROW_RISE_SRC}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 shrink-0"
              aria-hidden
            />
            <p className={cn('text-center text-xs font-normal', trendUpClass)}>{hint}</p>
          </div>
        ) : null}

        {isTrendDown ? (
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <img
              src={ARROW_DOWN_SRC}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 shrink-0 translate-y-1.5"
              aria-hidden
            />
            <p className="text-xs font-normal text-redOne">{hint}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
