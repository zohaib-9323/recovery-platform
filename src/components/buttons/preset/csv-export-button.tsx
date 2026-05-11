import type { MouseEvent as ReactMouseEvent } from 'react'
import { CSVLink } from 'react-csv'

import { MS } from '@/lib/manage-shipments-copy'
import { cn } from '@/lib/utils'

export type CsvExportButtonProps = {
  /** When set, behaves like trade-harmonizer `CsvExportButton` (CSVLink + green button). */
  data?: Record<string, unknown>[]
  filename?: string
  moduleName?: string
  timestamp?: Date | string
  buttonText?: string
  onClick?: () => void
  className?: string
  iconClass?: string
  isDisabled?: boolean
  iconSize?: string
  /** Legacy: simple download button without CSVLink */
  disabled?: boolean
}

function formatFilenameDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours(),
  )}-${pad(date.getMinutes())}`
}

export function CsvExportButton({
  data,
  filename,
  moduleName,
  timestamp,
  buttonText = MS.exportCSV,
  onClick = () => {},
  className = '',
  iconClass = 'icon-Download',
  isDisabled,
  iconSize,
  disabled = false,
}: CsvExportButtonProps) {
  const getFilename = () => {
    if (filename) return filename
    const ts = timestamp ? new Date(timestamp) : new Date()
    const base = moduleName || 'data'
    return `${base}-${formatFilenameDate(ts)}.csv`
  }

  if (data !== undefined) {
    const blocked = Boolean(isDisabled)
    return (
      <CSVLink
        data={data}
        filename={getFilename()}
        className={className}
        onClick={
          /* @types/react-csv types onClick's first arg incorrectly as MouseEventHandler */
          ((event: unknown) => {
            const e = event as ReactMouseEvent<HTMLAnchorElement>
            if (blocked) e.preventDefault()
            else onClick?.()
          }) as never
        }
      >
        <div className="flex flex-row items-center gap-2">
          <button
            type="button"
            disabled={blocked}
            className={`flex flex-row items-center gap-2 ${
              blocked ? 'bg-disableColor' : 'bg-green'
            } rounded-md p-2`}
          >
            <span className={`${iconClass} text-white ${iconSize ?? ''}`} />
            <p className="text-nowrap text-xs font-light text-white md:text-sm">{buttonText}</p>
          </button>
        </div>
      </CSVLink>
    )
  }

  const isBtnDisabled = disabled
  return (
    <button
      type="button"
      disabled={isBtnDisabled}
      onClick={onClick}
      className={cn(
        'inline-flex flex-row items-center gap-2 rounded-md p-2',
        isBtnDisabled ? 'cursor-not-allowed bg-disableColor' : 'bg-green',
        className,
      )}
    >
      <span className={cn('icon-Download text-white', iconSize)} />
      <span className="text-nowrap text-xs font-light text-white md:text-sm">{buttonText}</span>
    </button>
  )
}
