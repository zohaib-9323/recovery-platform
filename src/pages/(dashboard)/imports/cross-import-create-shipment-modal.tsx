import { useEffect, useId, useMemo, useState } from 'react'

import { useI18n } from '@/i18n/useI18n'
import type { M365UnprocessedDocument } from '@/types/recovery-m365-api'

export type CrossImportShipmentSubmitPayload = {
  title: string
  ciRow: M365UnprocessedDocument
  c88Row: M365UnprocessedDocument
}

export type CrossImportCreateShipmentModalProps = {
  /** Every pairable file, across every import job and every page of the list. */
  rows: M365UnprocessedDocument[]
  /** True while that full list is still loading — the dropdowns say so rather than looking empty. */
  isLoading?: boolean
  onClose: () => void
  /**
   * Fire-and-forget, exactly like the Inbox modal: the mutation runs in the
   * parent so it outlives this modal, which closes the moment it validates.
   */
  onSubmit: (payload: CrossImportShipmentSubmitPayload) => void
}

const inputClassName =
  'h-10 w-full rounded-md border border-bottomBorder bg-white px-3 text-sm text-black outline-none focus:ring-2 focus:ring-yellow/35'

/**
 * The cross-import twin of the Inbox's `CreateShipmentModal`.
 *
 * It is a separate component rather than a reuse because the two differ in the
 * one thing that matters: a row here is identified by `documentId` + `index`,
 * not by an index into a single document's list. Feeding these rows through the
 * Inbox modal would collapse rows from different imports that happen to share
 * an index.
 */
export function CrossImportCreateShipmentModal({
  rows,
  isLoading = false,
  onClose,
  onSubmit,
}: CrossImportCreateShipmentModalProps) {
  const { t } = useI18n()
  const titleInputId = useId()
  const ciSelectId = useId()
  const c88SelectId = useId()

  // Rows whose bytes were never stored can't be re-read server-side, so they
  // are not offerable here — same rule as the per-job modal.
  const selectableRows = useMemo(() => rows.filter((row) => Boolean(row.s3Key)), [rows])
  const hasHiddenRows = selectableRows.length < rows.length

  // Pre-fill from the classifier when the selection makes it unambiguous —
  // exactly one row of each type. Anything else stays blank rather than
  // guessing, because picking the wrong side silently produces a wrong pair.
  const defaults = useMemo(() => {
    const c88s = selectableRows.filter((row) => row.type === 'C88')
    const cis = selectableRows.filter((row) => row.type === 'PO')
    return {
      ci: cis.length === 1 ? cis[0].id : '',
      c88: c88s.length === 1 ? c88s[0].id : '',
    }
  }, [selectableRows])

  const [title, setTitle] = useState('')
  // `null` means "the user has not chosen" — the shown value falls back to the
  // inferred default. Derived rather than stored because the rows arrive AFTER
  // the first render (the modal opens, then fetches the full cross-page list),
  // so a default captured in useState would be stuck on the empty list forever.
  const [ciChoice, setCiChoice] = useState<string | null>(null)
  const [c88Choice, setC88Choice] = useState<string | null>(null)
  const ciId = ciChoice ?? defaults.ci
  const c88Id = c88Choice ?? defaults.c88
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const optionLabel = (row: M365UnprocessedDocument) => {
    const importName = row.folderNames.join(', ') || row.mailboxEmail || row.importJobId.slice(-6)
    return `${row.filename} — ${t('imports.unprocessed.modal.fromImport', { import: importName })}`
  }

  const handleSubmit = () => {
    setFormError(null)
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError(t('inbox.createShipment.errorTitleRequired'))
      return
    }
    if (!ciId || !c88Id) {
      setFormError(t('inbox.createShipment.errorSelectBoth'))
      return
    }
    if (ciId === c88Id) {
      setFormError(t('inbox.createShipment.errorSameFile'))
      return
    }
    const ciRow = selectableRows.find((row) => row.id === ciId)
    const c88Row = selectableRows.find((row) => row.id === c88Id)
    if (!ciRow?.s3Key || !c88Row?.s3Key) {
      setFormError(t('inbox.createShipment.errorSelectBoth'))
      return
    }

    onSubmit({ title: trimmedTitle, ciRow, c88Row })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="flex w-full items-center justify-center p-3">
        <div className="h-full w-[90%] sm:w-4/5 md:w-3/5 lg:w-2/4 xl:w-2/5 2xl:w-[34%]">
          <div className="no-scrollbar mx-auto h-full max-w-2xl rounded-lg bg-bgColor p-2 shadow-md sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-md text-nowrap font-bold text-black md:text-xl">
                {t('imports.unprocessed.modal.title')}
              </h1>
              <button type="button" onClick={onClose} aria-label={t('common.close')}>
                <span className="icon-close text-large text-black" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs font-normal text-black sm:text-sm">
                {t('imports.unprocessed.modal.description')}
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
                  value={ciId}
                  disabled={selectableRows.length === 0}
                  onChange={(e) => {
                    setCiChoice(e.target.value)
                    setFormError(null)
                  }}
                  className={inputClassName}
                >
                  <option value="">{t('inbox.createShipment.selectPlaceholder')}</option>
                  {selectableRows.map((row) => (
                    <option key={row.id} value={row.id} disabled={row.id === c88Id}>
                      {optionLabel(row)}
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
                  value={c88Id}
                  disabled={selectableRows.length === 0}
                  onChange={(e) => {
                    setC88Choice(e.target.value)
                    setFormError(null)
                  }}
                  className={inputClassName}
                >
                  <option value="">{t('inbox.createShipment.selectPlaceholder')}</option>
                  {selectableRows.map((row) => (
                    <option key={row.id} value={row.id} disabled={row.id === ciId}>
                      {optionLabel(row)}
                    </option>
                  ))}
                </select>
              </div>

              {isLoading ? (
                <p className="text-sm text-blackFive">{t('common.loading')}</p>
              ) : selectableRows.length === 0 ? (
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
