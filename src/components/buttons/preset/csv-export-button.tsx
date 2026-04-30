import { Download } from 'lucide-react'

import { cn } from '@/lib/utils'

export type CsvExportButtonProps = {
  buttonText?: string
  onClick?: () => void
  className?: string
  iconClassName?: string
  disabled?: boolean
}

export function CsvExportButton({
  buttonText = 'Export CSV',
  onClick,
  className,
  iconClassName,
  disabled = false,
}: CsvExportButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-md p-2',
        disabled ? 'cursor-not-allowed bg-[#CCCCCC]' : 'bg-[#16A34A] hover:bg-[#15803D]',
        className,
      )}
    >
      <Download className={cn('h-4 w-4 text-white', iconClassName)} strokeWidth={2} aria-hidden />
      <span className="text-nowrap text-xs font-light text-white md:text-sm">{buttonText}</span>
    </button>
  )
}
