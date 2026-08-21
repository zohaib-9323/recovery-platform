import { Check } from 'lucide-react'

export type PasswordChecks = {
  length: boolean
  lower: boolean
  upper: boolean
  special: boolean
  digit: boolean
}

function Pill({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className={`flex flex-row items-center justify-center gap-1.5 rounded-md px-2 py-1.5 ${
        ok ? 'bg-lightGreenTwo' : 'bg-grey'
      }`}
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

/** Password strength pills — mirrors trade-harmonizer's `ValidationPill` row. */
export function PasswordRules({ checks }: { checks: PasswordChecks }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Pill ok={checks.length} text="Length ≥ 8" />
      <Pill ok={checks.lower} text="1 small letter" />
      <Pill ok={checks.upper} text="1 capital letter" />
      <Pill ok={checks.special} text="1 special character" />
      <Pill ok={checks.digit} text="1 digit" />
    </div>
  )
}
