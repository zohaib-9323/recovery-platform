import { useState } from 'react'
import { X } from 'lucide-react'

import { useAuth } from '@/app/hooks/useAuth'
import { Popup } from '@/components/popup/popup'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

import { DateRangeStep, type DateRangeValue } from './date-range-step'
import { getDaysSelected } from './date-range-utils'
import { FolderSelectDropdown, type FolderOption } from './folder-select-dropdown'
import { ReviewImportStep } from './review-import-step'

const FOLDER_OPTIONS: FolderOption[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent-items', label: 'Sent Items' },
  { value: 'archive', label: 'Archive' },
  { value: 'matters-2024', label: 'Matters 2024' },
  { value: 'matters-2025', label: 'Matters 2025' },
]

const IMPORT_STEPS = ['source', 'dateRange', 'review'] as const
type ImportStepId = (typeof IMPORT_STEPS)[number]

const EMPTY_DATE_RANGE: DateRangeValue = { startDate: null, endDate: null }

type StartImportModalProps = {
  open: boolean
  onClose: () => void
}

export function StartImportModal({ open, onClose }: StartImportModalProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [step, setStep] = useState<ImportStepId>('source')
  const [folder, setFolder] = useState(FOLDER_OPTIONS[0].value)
  const [dateRange, setDateRange] = useState<DateRangeValue>(EMPTY_DATE_RANGE)

  const email = user?.email ?? 'user@client.com'
  const stepIndex = IMPORT_STEPS.indexOf(step)
  const folderLabel = FOLDER_OPTIONS.find((option) => option.value === folder)?.label ?? folder

  const canProceed = step === 'dateRange' ? Boolean(dateRange.startDate && dateRange.endDate) : true

  const handleClose = () => {
    setStep('source')
    setFolder(FOLDER_OPTIONS[0].value)
    setDateRange(EMPTY_DATE_RANGE)
    onClose()
  }

  const handleNext = () => {
    if (step === 'source') {
      setStep('dateRange')
    } else if (step === 'dateRange' && dateRange.startDate && dateRange.endDate) {
      setStep('review')
    } else if (step === 'review') {
      handleClose()
    }
  }

  return (
    <Popup
      open={open}
      onClose={handleClose}
      className="max-w-[670px] rounded-[22px] border-0 p-5 shadow-[0px_8px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold uppercase text-rp-heading">
            {t('imports.startModal.title')}
          </h2>
          <button
            type="button"
            aria-label={t('common.close')}
            className="rounded p-1 text-rp-icon hover:bg-rp-surface"
            onClick={handleClose}
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="flex flex-col gap-10">
          <ol className="flex items-center gap-3 px-3">
            <ImportStep
              number={1}
              label={t('imports.startModal.steps.source')}
              status={stepIndex > 0 ? 'completed' : 'current'}
              onClick={stepIndex > 0 ? () => setStep('source') : undefined}
            />
            <StepDivider />
            <ImportStep
              number={2}
              label={t('imports.startModal.steps.dateRange')}
              status={stepIndex > 1 ? 'completed' : stepIndex === 1 ? 'current' : 'upcoming'}
              onClick={stepIndex > 1 ? () => setStep('dateRange') : undefined}
            />
            <StepDivider />
            <ImportStep
              number={3}
              label={t('imports.startModal.steps.review')}
              status={stepIndex === 2 ? 'current' : 'upcoming'}
            />
          </ol>

          {step === 'source' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-rp-fg">
                  {t('imports.startModal.mailboxLabel')}
                </span>
                <div className="flex h-10 w-full items-center rounded-[5px] border border-rp-border bg-rp-disabled px-[15px] text-sm text-rp-muted">
                  {email}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-rp-fg">
                  {t('imports.startModal.folderLabel')}
                </span>
                <FolderSelectDropdown
                  value={folder}
                  onChange={setFolder}
                  options={FOLDER_OPTIONS}
                />
                <p className="text-xs text-rp-muted">{t('imports.startModal.folderHint')}</p>
              </div>
            </div>
          ) : step === 'dateRange' ? (
            <DateRangeStep value={dateRange} onChange={setDateRange} />
          ) : dateRange.startDate && dateRange.endDate ? (
            <ReviewImportStep
              folderLabel={folderLabel}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              daysSelected={getDaysSelected(dateRange.startDate, dateRange.endDate)}
            />
          ) : null}

          <div className="w-full border-t border-rp-border" />
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" className="w-[119px]" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="default"
            className="w-[149px]"
            disabled={!canProceed}
            onClick={handleNext}
          >
            {t('imports.startModal.next')}
          </Button>
        </div>
      </div>
    </Popup>
  )
}

function ImportStep({
  number,
  label,
  status,
  onClick,
}: {
  number: number
  label: string
  status: 'completed' | 'current' | 'upcoming'
  onClick?: () => void
}) {
  return (
    <li className="flex shrink-0 items-center gap-2.5">
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px]',
          status === 'completed' ? 'bg-rp-success text-white' : 'bg-rp-border text-rp-fg',
        )}
      >
        {number}
      </span>
      {onClick ? (
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-auto whitespace-nowrap rounded p-1 text-xs font-normal text-rp-heading hover:bg-rp-surface hover:underline"
          onClick={onClick}
        >
          {label}
        </Button>
      ) : (
        <span
          className={cn(
            'whitespace-nowrap text-xs',
            status === 'upcoming' ? 'text-rp-muted' : 'text-rp-heading',
          )}
        >
          {label}
        </span>
      )}
    </li>
  )
}

function StepDivider() {
  return <span className="h-px w-9 shrink-0 bg-rp-border" aria-hidden />
}
