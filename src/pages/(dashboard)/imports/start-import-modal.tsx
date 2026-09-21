import { useMemo, useState } from 'react'
import { X } from 'lucide-react'

import {
  useGetM365FoldersQuery,
  useGetM365StatusQuery,
  useStartM365ImportJobMutation,
} from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Popup } from '@/components/popup/popup'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import { cn } from '@/lib/utils'

import { DateRangeStep, type DateRangeValue } from './date-range-step'
import { endOfDay, getDaysSelected } from './date-range-utils'
import { FolderSelectDropdown, type FolderOption } from './folder-select-dropdown'
import { ReviewImportStep } from './review-import-step'

const IMPORT_STEPS = ['source', 'dateRange', 'review'] as const
type ImportStepId = (typeof IMPORT_STEPS)[number]

const EMPTY_DATE_RANGE: DateRangeValue = { startDate: null, endDate: null }

type StartImportModalProps = {
  open: boolean
  onClose: () => void
}

export function StartImportModal({ open, onClose }: StartImportModalProps) {
  const { t } = useI18n()
  const { data: m365Status } = useGetM365StatusQuery(undefined, { skip: !open })
  const [step, setStep] = useState<ImportStepId>('source')
  const [folderIds, setFolderIds] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRangeValue>(EMPTY_DATE_RANGE)

  const {
    data: foldersData,
    isFetching: isFoldersLoading,
    isError: isFoldersError,
    refetch: refetchFolders,
  } = useGetM365FoldersQuery(undefined, { skip: !open })
  const [startImportJob, { isLoading: isSubmitting }] = useStartM365ImportJobMutation()

  const folders = useMemo(() => foldersData?.content?.folders ?? [], [foldersData])
  const folderOptions: FolderOption[] = useMemo(
    () =>
      folders.map((f) => ({
        value: f.id,
        label: `${'  '.repeat(f.depth)}${f.displayName}`,
      })),
    [folders],
  )

  // Default to the first folder once the list loads, without an effect: fall back
  // whenever the user hasn't picked values that still exist in the fetched list.
  const validSelection = folderIds.filter((id) => folders.some((f) => f.id === id))
  const selectedFolderIds =
    validSelection.length > 0 ? validSelection : folders[0] ? [folders[0].id] : []

  const selectedFolders = selectedFolderIds.map((id) => ({
    folderId: id,
    folderName: folders.find((f) => f.id === id)?.displayName ?? id,
  }))

  const email = m365Status?.content?.email ?? 'user@client.com'
  const stepIndex = IMPORT_STEPS.indexOf(step)
  const folderLabel = selectedFolders.map((f) => f.folderName).join(', ')

  const canProceed =
    step === 'dateRange'
      ? Boolean(dateRange.startDate && dateRange.endDate)
      : step === 'source'
        ? selectedFolderIds.length > 0
        : true

  const handleClose = () => {
    setStep('source')
    setFolderIds([])
    setDateRange(EMPTY_DATE_RANGE)
    onClose()
  }

  const handleNext = async () => {
    if (step === 'source') {
      setStep('dateRange')
    } else if (step === 'dateRange' && dateRange.startDate && dateRange.endDate) {
      setStep('review')
    } else if (step === 'review' && dateRange.startDate && dateRange.endDate) {
      try {
        await startImportJob({
          folders: selectedFolders,
          dateRangeStart: dateRange.startDate.toISOString(),
          // endOfDay ensures "Aug 18 → Aug 18" sends 23:59:59.999, not midnight,
          // so the backend receives a non-zero range covering the full selected day.
          dateRangeEnd: endOfDay(dateRange.endDate).toISOString(),
        }).unwrap()
        showCustomToast({
          type: 'success',
          title: t('imports.startModal.title'),
          message: t('imports.startModal.successToast'),
        })
        handleClose()
      } catch (error) {
        showCustomToast({
          type: 'error',
          title: t('imports.startModal.title'),
          message: getErrorMessage(error, t('imports.startModal.errorToast')),
        })
      }
    }
  }

  return (
    <Popup
      open={open}
      onClose={handleClose}
      closeOnBackdrop={false}
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
          <div className="no-scrollbar overflow-x-auto border border-rp-border px-3 py-3 sm:px-6 sm:py-4">
            <ol className="flex items-center">
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
          </div>

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
                {isFoldersLoading ? (
                  <CustomLoader />
                ) : isFoldersError ? (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-xs text-red-600">{t('imports.startModal.folderError')}</p>
                    <Button
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={refetchFolders}
                    >
                      {t('common.retry')}
                    </Button>
                  </div>
                ) : (
                  <FolderSelectDropdown
                    value={selectedFolderIds}
                    onChange={setFolderIds}
                    options={folderOptions}
                  />
                )}
                {!isFoldersLoading && !isFoldersError && folders.length === 0 ? (
                  <p className="text-xs text-rp-muted">{t('imports.startModal.folderEmpty')}</p>
                ) : null}
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
            disabled={!canProceed || isSubmitting}
            onClick={handleNext}
          >
            {step === 'review'
              ? isSubmitting
                ? t('imports.startModal.submitting')
                : t('imports.startModal.submit')
              : t('imports.startModal.next')}
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
    <li className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          status === 'completed' && 'bg-rp-green text-white',
          status === 'current' && 'bg-rp-accent text-white',
          status === 'upcoming' && 'bg-rp-disabled text-rp-muted',
        )}
      >
        {number}
      </span>
      {onClick ? (
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-auto whitespace-nowrap rounded p-1 text-xs font-normal text-rp-heading hover:bg-rp-surface hover:underline sm:text-sm"
          onClick={onClick}
        >
          {label}
        </Button>
      ) : (
        <span
          className={cn(
            'whitespace-nowrap text-xs sm:text-sm',
            status === 'upcoming' ? 'text-rp-muted' : 'font-semibold text-rp-heading',
          )}
        >
          {label}
        </span>
      )}
    </li>
  )
}

function StepDivider() {
  return (
    <span
      className="mx-1.5 h-[1.5px] w-4 shrink-0 flex-1 bg-[#7D7D7D] sm:mx-3 sm:w-auto"
      aria-hidden
    />
  )
}
