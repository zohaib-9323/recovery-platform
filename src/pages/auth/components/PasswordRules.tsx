import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export type PasswordChecks = {
  length: boolean
  lower: boolean
  upper: boolean
  special: boolean
  digit: boolean
}

function Pill({ ok, text, className }: { ok: boolean; text: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-center gap-1.5 rounded-md px-2 py-1.5',
        ok ? 'bg-lightGreenTwo' : 'bg-grey',
        className,
      )}
    >
      {ok ? <Check className="h-2 w-2 text-greenOne" strokeWidth={3} /> : null}
      <span
        className={`text-[10px] font-normal md:text-xs ${ok ? 'text-greenOne' : 'text-greyOne'}`}
      >
        {text}
      </span>
    </div>
  )
}

export type PasswordRulesProps = {
  checks: PasswordChecks
  /** Row wrapper override — e.g. the Manage Users modals use a 10px gap and no top margin. */
  className?: string
  /** Per-pill override — e.g. the Manage Users modals use the Figma's 35px pill. */
  pillClassName?: string
}

/** Password strength pills — mirrors trade-harmonizer's `ValidationPill` row. */
export function PasswordRules({ checks, className, pillClassName }: PasswordRulesProps) {
  return (
    <div className={cn('mt-3 flex flex-wrap gap-2', className)}>
      <Pill ok={checks.length} text="Length ≥ 8" className={pillClassName} />
      <Pill ok={checks.lower} text="1 small letter" className={pillClassName} />
      <Pill ok={checks.upper} text="1 capital letter" className={pillClassName} />
      <Pill ok={checks.special} text="1 special character" className={pillClassName} />
      <Pill ok={checks.digit} text="1 digit" className={pillClassName} />
    </div>
  )
}
