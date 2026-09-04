import { Popup } from '@/components/popup'
import { MU } from '@/lib/manage-users-copy'

export type UserStatusConfirmModalProps = {
  open: boolean
  /** `suspend` shows the destructive copy, `reactivate` the positive one. */
  intent: 'suspend' | 'reactivate'
  userName: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Not part of the Figma frames — confirmation step for the row action menu's
 * Suspend / Reactivate entries, built from the project's `Popup`.
 */
export function UserStatusConfirmModal({
  open,
  intent,
  userName,
  onConfirm,
  onClose,
}: UserStatusConfirmModalProps) {
  const isSuspend = intent === 'suspend'

  return (
    <Popup open={open} onClose={onClose} className="max-w-[470px]">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h2 className="text-large font-semibold text-black">
            {isSuspend ? MU.suspendUser : MU.reactivateUser}
          </h2>
          <p className="text-xsmall font-normal text-lightBlackOne">
            {isSuspend ? MU.suspendUserDesc : MU.reactivateUserDesc}
          </p>
          <p className="text-xsmall font-medium capitalize text-black">{userName}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] border border-bottomBorder bg-white px-6 py-2.5 text-xsmall font-normal text-black transition hover:bg-greyFour"
          >
            {MU.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-[5px] px-6 py-2.5 text-xsmall font-normal text-white transition hover:opacity-90 ${
              isSuspend ? 'bg-redOne' : 'bg-green'
            }`}
          >
            {isSuspend ? MU.yesSuspend : MU.yesActivate}
          </button>
        </div>
      </div>
    </Popup>
  )
}
