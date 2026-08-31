import { useEffect, useId, useMemo, useState } from 'react'

import { useI18n } from '@/i18n/useI18n'
import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'

export type CreateShipmentSubmitPayload = {
  title: string
  ciRow: InboxUnprocessedShipmentRow
  c88Row: InboxUnprocessedShipmentRow
  /**
   * Optional packing list. A shipment is C88 + CI; a PL is a third document that
   * only contributes fuller line-item descriptions, so `undefined` is the normal
   * case and never an error.
   */
  plRow?: InboxUnprocessedShipmentRow
}

export type CreateShipmentModalProps = {
  rows: InboxUnprocessedShipmentRow[]
  onClose: () => void
  /**
   * Called once client-side validation passes. The actual mutation runs in the
   * background from the parent (`InboxDetailPanel`) so it survives this modal
   * closing — see docs/retry-and-manual-shipment-creation.md. This callback is
   * fire-and-forget from the modal's point of view: it never awaits it, and
   * closes immediately after calling it.
   */
  onSubmit: (payload: CreateShipmentSubmitPayload) => void
}

const inputClassName =
  'h-10 w-full rounded-md border border-bottomBorder bg-white px-3 text-sm text-black outline-none focus:ring-2 focus:ring-yellow/35'

export function CreateShipmentModal({ rows, onClose, onSubmit }: CreateShipmentModalProps) {
  const { t } = useI18n()
  const titleInputId = useId()
  const ciSelectId = useId()
  const c88SelectId = useId()
  const plSelectId = useId()

  const [title, setTitle] = useState('')
  const [ciIndex, setCiIndex] = useState<string>('')
  const [c88Index, setC88Index] = useState<string>('')
  // Optional third leg. '' means "no packing list", which is the normal case —
  // a shipment is complete with just a C88 and a CI.
  const [plIndex, setPlIndex] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

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

  const handleSubmit = () => {
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
    // The packing list is optional: an unset or unresolvable pick simply means
    // the shipment is created without one, never a validation failure.
    const plRow =
      plIndex === '' ? undefined : selectableRows.find((row) => String(row.sourceIndex) === plIndex)
    if (plIndex !== '' && !plRow?.s3Key) {
      setFormError(t('inbox.createShipment.errorSelectBoth'))
      return
    }

    // Hand off to the parent and close right away — the request itself keeps running
    // in the background (tracked as an "in processing" row) even though this modal
    // is about to unmount.
    onSubmit({ title: trimmedTitle, ciRow, c88Row, plRow })
    onClose()
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
              <button type="button" onClick={onClose} aria-label={t('common.close')}>
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
                  disabled={selectableRows.length === 0}
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
                  disabled={selectableRows.length === 0}
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

              <div>
                <label
                  className="mb-2 block text-xs font-semibold text-black sm:text-sm"
                  htmlFor={plSelectId}
                >
                  {t('inbox.createShipment.plLabel')}
                </label>
                <select
                  id={plSelectId}
                  value={plIndex}
                  disabled={selectableRows.length === 0}
                  onChange={(e) => {
                    setPlIndex(e.target.value)
                    setFormError(null)
                  }}
                  className={inputClassName}
                >
                  <option value="">{t('inbox.createShipment.plNone')}</option>
                  {selectableRows.map((row) => (
                    <option
                      key={row.sourceIndex}
                      value={row.sourceIndex}
                      disabled={
                        String(row.sourceIndex) === ciIndex || String(row.sourceIndex) === c88Index
                      }
                    >
                      {row.fileName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs font-normal text-greyOne">
                  {t('inbox.createShipment.plHint')}
                </p>
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
                className="rounded-lg border border-bottomBorder px-4 py-2 !font-light text-black disabled:opacity-70"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectableRows.length === 0}
                className="rounded-lg bg-yellow px-4 py-2 !font-light text-white disabled:bg-disableColor disabled:opacity-70"
              >
                {t('inbox.createShipment.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
