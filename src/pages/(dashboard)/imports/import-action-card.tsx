import { type ReactNode } from 'react'
import { FolderMinus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ImportActionCardProps = {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  className?: string
}

export function ImportActionCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: ImportActionCardProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-[504px] flex-col items-center gap-[26px] rounded-[10px] bg-rp-page p-[29px] shadow-[0px_0px_7.5px_rgba(0,0,0,0.13)]',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-5">
        {icon}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[19px] font-bold tracking-tight text-rp-fg">{title}</p>
          <p className="text-sm leading-6 text-rp-muted">{description}</p>
        </div>
      </div>
      <Button className="w-[223px]" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

/** Microsoft's brand mark is a fixed 4-colour grid — not a themeable design token. */
const MICROSOFT_LOGO_COLORS = ['bg-[#F35325]', 'bg-[#81BC06]', 'bg-[#05A6F0]', 'bg-[#FFBA08]']

export function Microsoft365Icon() {
  return (
    <div className="grid size-[46px] grid-cols-2 grid-rows-2 gap-[6px]" aria-hidden>
      {MICROSOFT_LOGO_COLORS.map((color) => (
        <span key={color} className={cn('size-full', color)} />
      ))}
    </div>
  )
}

export function NoImportsIcon() {
  return (
    <div className="flex size-[53px] items-center justify-center rounded-xl bg-rp-surface">
      <FolderMinus className="size-6 text-rp-icon" aria-hidden />
    </div>
  )
}
