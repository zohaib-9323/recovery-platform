import { useEffect, useId, useMemo, useState } from 'react'

import { useCreateManualShipmentMutation } from '@/app/services/recoveryDocumentActionsApi'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'

export type CreateShipmentModalProps = {
  documentId: string
  rows: InboxUnprocessedShipmentRow[]
  onClose: () => void
  onCreated?: () => Promise<unknown> | unknown
}

const inputClassName =
  'h-10 w-full rounded-md border border-bottomBorder bg-white px-3 text-sm text-black outline-none focus:ring-2 focus:ring-yellow/35'

export function CreateShipmentModal({
  documentId,
  rows,
  onClose,
  onCreated,
}: CreateShipmentModalProps) {
  const { t } = useI18n()
  const titleInputId = useId()
  const ciSelectId = useId()
  const c88SelectId = useId()

  const [title, setTitle] = useState('')
  const [ciIndex, setCiIndex] = useState<string>('')
  const [c88Index, setC88Index] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [createManualShipment, { isLoading }] = useCreateManualShipmentMutation()

  // Only files with a current s3Key can be safely selected — the backend re-validates it
  // against the document's current state and rejects anything else. Older documents
  // predating that field just aren't selectable here.
  const selectableRows = useMemo(() => rows.filter((row) => Boolean(row.s3Key)), [rows])
  const hasHiddenRows = selectableRows.length < rows.length

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleSubmit = async () => {
    setFormError(null)
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError(t('inbox.createShipment.errorTitleRequired'))
      return
    }
    if (ciIndex === '' || c88Index === '') {
      setFormError(t('inbox.createShipment.errorSelectBoth'))
      return
    }
    if (ciIndex === c88Index) {
      setFormError(t('inbox.createShipment.errorSameFile'))
      return
    }
    const ciRow = selectableRows.find((row) => String(row.sourceIndex) === ciIndex)
    const c88Row = selectableRows.find((row) => String(row.sourceIndex) === c88Index)
    if (!ciRow?.s3Key || !c88Row?.s3Key) {
      setFormError(t('inbox.createShipment.errorSelectBoth'))
      return
    }

    try {
      await createManualShipment({
        id: documentId,
        title: trimmedTitle,
        ciIndex: ciRow.sourceIndex,
        ciS3Key: ciRow.s3Key,
        c88Index: c88Row.sourceIndex,
        c88S3Key: c88Row.s3Key,
      }).unwrap()
      showCustomToast({
        type: 'success',
        title: 'Success',
        message: t('inbox.createShipment.success'),
      })
      await onCreated?.()
      onClose()
    } catch (error) {
      setFormError(getRtkErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="flex w-full items-center justify-center p-3">
        <div className="h-full w-[90%] sm:w-4/5 md:w-3/5 lg:w-2/4 xl:w-2/5 2xl:w-[30%]">
          <div className="no-scrollbar mx-auto h-full max-w-2xl rounded-lg bg-bgColor p-2 shadow-md sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-md text-nowrap font-bold text-black md:text-xl">
                {t('inbox.createShipment.title')}
              </h1>
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                aria-label={t('common.close')}
              >
                <span className="icon-close text-large text-black" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs font-normal text-black sm:text-sm">
                {t('inbox.createShipment.description')}
              </p>
              {hasHiddenRows ? (
                <p className="mt-1 text-xs font-light text-blackFive">
                  {t('inbox.createShipment.missingReferenceNotice')}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label
                  className="mb-2 block text-xs font-semibold text-black sm:text-sm"
                  htmlFor={titleInputId}
                >
                  {t('inbox.createShipment.titleLabel')}
                  <span className="ml-1 text-sm font-semibold text-yellow">*</span>
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  value={title}
                  maxLength={200}
                  disabled={isLoading}
                  placeholder={t('inbox.createShipment.titlePlaceholder')}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setFormError(null)
                  }}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-semibold text-black sm:text-sm"
                  htmlFor={ciSelectId}
                >
                  {t('inbox.createShipment.ciLabel')}
                  <span className="ml-1 text-sm font-semibold text-yellow">*</span>
                </label>
                <select
                  id={ciSelectId}
                  value={ciIndex}
                  disabled={isLoading || selectableRows.length === 0}
                  onChange={(e) => {
                    setCiIndex(e.target.value)
                    setFormError(null)
                  }}
                  className={inputClassName}
                >
                  <option value="">{t('inbox.createShipment.selectPlaceholder')}</option>
                  {selectableRows.map((row) => (
                    <option
                      key={row.sourceIndex}
                      value={row.sourceIndex}
                      disabled={String(row.sourceIndex) === c88Index}
                    >
                      {row.fileName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-semibold text-black sm:text-sm"
                  htmlFor={c88SelectId}
                >
                  {t('inbox.createShipment.c88Label')}
                  <span className="ml-1 text-sm font-semibold text-yellow">*</span>
                </label>
                <select
                  id={c88SelectId}
                  value={c88Index}
                  disabled={isLoading || selectableRows.length === 0}
                  onChange={(e) => {
                    setC88Index(e.target.value)
                    setFormError(null)
                  }}
                  className={inputClassName}
                >
                  <option value="">{t('inbox.createShipment.selectPlaceholder')}</option>
                  {selectableRows.map((row) => (
                    <option
                      key={row.sourceIndex}
                      value={row.sourceIndex}
                      disabled={String(row.sourceIndex) === ciIndex}
                    >
                      {row.fileName}
                    </option>
                  ))}
                </select>
              </div>

              {selectableRows.length === 0 ? (
                <p className="text-sm text-redOne">{t('inbox.createShipment.noFilesAvailable')}</p>
              ) : null}
              {formError ? <p className="text-sm text-redOne">{formError}</p> : null}
            </div>

            <div className="mt-6 flex w-full justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg border border-bottomBorder px-4 py-2 !font-light text-black disabled:opacity-70"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || selectableRows.length === 0}
                className="rounded-lg bg-yellow px-4 py-2 !font-light text-white disabled:bg-disableColor disabled:opacity-70"
              >
                {isLoading
                  ? t('inbox.createShipment.submitting')
                  : t('inbox.createShipment.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
