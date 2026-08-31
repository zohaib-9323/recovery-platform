import { useEffect, useId, useMemo, useState } from 'react'

import { DropdownField, InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import type { M365UnprocessedDocument } from '@/types/recovery-m365-api'

export type CrossImportShipmentSubmitPayload = {
  title: string
  ciRow: M365UnprocessedDocument
  c88Row: M365UnprocessedDocument
  /**
   * Optional packing list. A shipment is C88 + CI; a PL is a third document that
   * only contributes fuller line-item descriptions, so `undefined` is the normal
   * case and never an error.
   */
  plRow?: M365UnprocessedDocument
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

const RequiredMark = () => <span className="ml-1 text-sm font-semibold text-yellow">*</span>

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
  const plSelectId = useId()

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
  // The packing list is optional and never inferred: an empty string means "no
  // packing list", which is the normal case, so there is no default to fall back
  // to the way the two required sides have.
  const [plId, setPlId] = useState<string>('')
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
    // Optional: an unset or unresolvable pick means the shipment is created
    // without a packing list, never a validation failure.
    const plRow = plId === '' ? undefined : selectableRows.find((row) => row.id === plId)
    if (plId !== '' && !plRow?.s3Key) {
      setFormError(t('inbox.createShipment.errorSelectBoth'))
      return
    }

    onSubmit({ title: trimmedTitle, ciRow, c88Row, plRow })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-25 backdrop-blur-sm">
      <div className="flex w-full items-center justify-center p-3">
        <div className="h-full w-[90%] sm:w-4/5 md:w-3/5 lg:w-2/4 xl:w-2/5 2xl:w-[34%]">
          <div className="no-scrollbar mx-auto h-full max-w-2xl rounded-lg bg-rp-bg p-2 shadow-md sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-xl text-nowrap font-bold text-rp-heading md:text-2xl">
                {t('imports.unprocessed.modal.title')}
              </h1>
              <button type="button" onClick={onClose} aria-label={t('common.close')}>
                <span className="icon-close text-large text-rp-fg" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-sm text-rp-fg sm:text-base">
                {t('imports.unprocessed.modal.description')}
              </p>
              {hasHiddenRows ? (
                <p className="mt-1 text-xs font-light text-blackFive">
                  {t('inbox.createShipment.missingReferenceNotice')}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <InputField
                fieldType="text"
                id={titleInputId}
                label={
                  <>
                    {t('inbox.createShipment.titleLabel')}
                    <RequiredMark />
                  </>
                }
                value={title}
                maxLength={200}
                placeholder={t('inbox.createShipment.titlePlaceholder')}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setFormError(null)
                }}
              />

              <DropdownField
                id={ciSelectId}
                label={
                  <>
                    {t('inbox.createShipment.ciLabel')}
                    <RequiredMark />
                  </>
                }
                value={ciId}
                disabled={selectableRows.length === 0}
                onChange={(e) => {
                  setCiChoice(e.target.value)
                  setFormError(null)
                }}
                placeholder={t('inbox.createShipment.selectPlaceholder')}
                options={selectableRows.map((row) => ({
                  value: row.id,
                  label: optionLabel(row),
                  disabled: row.id === c88Id,
                }))}
              />

              <DropdownField
                id={c88SelectId}
                label={
                  <>
                    {t('inbox.createShipment.c88Label')}
                    <RequiredMark />
                  </>
                }
                value={c88Id}
                disabled={selectableRows.length === 0}
                onChange={(e) => {
                  setC88Choice(e.target.value)
                  setFormError(null)
                }}
                placeholder={t('inbox.createShipment.selectPlaceholder')}
                options={selectableRows.map((row) => ({
                  value: row.id,
                  label: optionLabel(row),
                  disabled: row.id === ciId,
                }))}
              />

              {/* Optional third leg — no RequiredMark, and an explicit "none" option. */}
              <DropdownField
                id={plSelectId}
                label={t('inbox.createShipment.plLabel')}
                value={plId}
                disabled={selectableRows.length === 0}
                onChange={(e) => {
                  setPlId(e.target.value)
                  setFormError(null)
                }}
                placeholder={t('inbox.createShipment.plNone')}
                options={selectableRows.map((row) => ({
                  value: row.id,
                  label: optionLabel(row),
                  disabled: row.id === ciId || row.id === c88Id,
                }))}
              />
              <p className="-mt-2 text-xs font-light text-blackFive">
                {t('inbox.createShipment.plHint')}
              </p>

              {isLoading ? (
                <p className="text-sm text-blackFive">{t('common.loading')}</p>
              ) : selectableRows.length === 0 ? (
                <p className="text-sm text-redOne">{t('inbox.createShipment.noFilesAvailable')}</p>
              ) : null}
              {formError ? <p className="text-sm text-redOne">{formError}</p> : null}
            </div>

            <div className="mt-6 flex w-full gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1"
                onClick={handleSubmit}
                disabled={selectableRows.length === 0}
              >
                {t('inbox.createShipment.submit')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
