import { Popup } from '@/components/popup'
import { MU } from '@/lib/manage-users-copy'

export type DeleteRequestConfirmModalProps = {
  open: boolean
  intent: 'approve' | 'reject'
  requesterName: string
  isSubmitting: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Same pattern as `UserStatusConfirmModal` — confirms before the approve/reject mutation fires. */
export function DeleteRequestConfirmModal({
  open,
  intent,
  requesterName,
  isSubmitting,
  onConfirm,
  onClose,
}: DeleteRequestConfirmModalProps) {
  const isApprove = intent === 'approve'

  return (
    <Popup open={open} onClose={isSubmitting ? undefined : onClose} className="max-w-[470px]">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h2 className="text-large font-semibold text-black">
            {isApprove ? MU.deleteRequestApproveTitle : MU.deleteRequestRejectTitle}
          </h2>
          <p className="text-xsmall font-normal text-lightBlackOne">
            {isApprove ? MU.deleteRequestApproveDesc : MU.deleteRequestRejectDesc}
          </p>
          <p className="text-xsmall font-medium capitalize text-black">{requesterName}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-[5px] border border-bottomBorder bg-white px-6 py-2.5 text-xsmall font-normal text-black transition hover:bg-greyFour disabled:opacity-50"
          >
            {MU.cancel}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`rounded-[5px] px-6 py-2.5 text-xsmall font-normal text-white transition hover:opacity-90 disabled:opacity-50 ${
              isApprove ? 'bg-green' : 'bg-redOne'
            }`}
          >
            {isSubmitting
              ? isApprove
                ? 'Approving…'
                : 'Rejecting…'
              : isApprove
                ? MU.yesApprove
                : MU.yesReject}
          </button>
        </div>
      </div>
    </Popup>
  )
}
