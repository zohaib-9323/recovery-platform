import { Popup } from '@/components/popup'
import { useI18n } from '@/i18n/useI18n'

export type DeleteUnprocessedDocumentModalProps = {
  open: boolean
  fileName: string
  isDeleting: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirmation step for deleting an unprocessable import document.
 *
 * Deleting removes the stored file as well as the row and cannot be undone, so
 * this is a deliberate stop rather than a one-click action — and it names the
 * file, because the whole point of the screen is that several near-identical
 * leftovers are listed together.
 */
export function DeleteUnprocessedDocumentModal({
  open,
  fileName,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteUnprocessedDocumentModalProps) {
  const { t } = useI18n()

  return (
    <Popup open={open} onClose={onClose} className="max-w-[470px]">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h2 className="text-large font-semibold text-black">
            {t('imports.unprocessed.delete.title')}
          </h2>
          <p className="text-xsmall font-normal text-lightBlackOne">
            {t('imports.unprocessed.delete.description')}
          </p>
          <p className="break-all text-xsmall font-medium text-black">{fileName}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-[5px] border border-bottomBorder bg-white px-6 py-2.5 text-xsmall font-normal text-black transition hover:bg-greyFour disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('imports.unprocessed.delete.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-[5px] bg-redOne px-6 py-2.5 text-xsmall font-normal text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting
              ? t('imports.unprocessed.delete.deleting')
              : t('imports.unprocessed.delete.confirm')}
          </button>
        </div>
      </div>
    </Popup>
  )
}
