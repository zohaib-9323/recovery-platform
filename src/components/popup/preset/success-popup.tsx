import { CircleCheckBig } from 'lucide-react'

import { LoginButton } from '@/components/buttons'
import { Popup } from '@/components/popup/popup'

type SuccessPopupProps = {
  open: boolean
  title: string
  description: string
  actionLabel?: string
  onAction: () => void
  onClose?: () => void
}

export function SuccessPopup({
  open,
  title,
  description,
  actionLabel = 'Continue',
  onAction,
  onClose,
}: SuccessPopupProps) {
  return (
    <Popup open={open} onClose={onClose} className="max-w-[470px]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-[#D9F5E5] p-6">
          <CircleCheckBig className="h-16 w-16 text-[#1FA355]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-[36px] font-bold leading-tight text-rp-heading">{title}</h2>
          <p className="text-base text-rp-description">{description}</p>
        </div>
        <LoginButton type="button" onClick={onAction}>
          {actionLabel}
        </LoginButton>
      </div>
    </Popup>
  )
}
