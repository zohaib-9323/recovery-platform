import { type ReactNode } from 'react'
import { Info } from 'lucide-react'

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border-[0.8px] border-rp-blue bg-rp-blue/10 px-3 py-2.5">
      <Info className="mt-0.5 size-[17px] shrink-0 text-rp-blue" aria-hidden />
      <p className="text-xs leading-5 text-rp-blue">{children}</p>
    </div>
  )
}
