import { useState } from 'react'
import { KeyRound } from 'lucide-react'

import { usePostRecoveryDeleteRequestMutation } from '@/app/services/recoveryApi'
import { useAuth } from '@/app/hooks/useAuth'
import { InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { getRtkErrorMessage } from '@/lib/api-errors'

import { LEAVING_REASONS } from './settings-constants'

export function DeleteAccountTab() {
  const { user } = useAuth()
  const [postDelete, { isLoading }] = usePostRecoveryDeleteRequestMutation()

  const [reasonIndex, setReasonIndex] = useState(0)
  const [customReason, setCustomReason] = useState('')
  const [password, setPassword] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const resolvedReason =
    reasonIndex === LEAVING_REASONS.length - 1 ? customReason.trim() : LEAVING_REASONS[reasonIndex]

  const canOpenConfirm =
    password.trim().length > 0 &&
    (reasonIndex !== LEAVING_REASONS.length - 1 || customReason.trim().length > 0)

  const handleRequestClick = () => {
    setBanner(null)
    if (!canOpenConfirm) {
      setBanner({
        type: 'err',
        text:
          reasonIndex === LEAVING_REASONS.length - 1 && !customReason.trim()
            ? 'Please describe your reason.'
            : 'Enter your password to continue.',
      })
      return
    }
    setConfirmOpen(true)
  }

  const submitDelete = async () => {
    setBanner(null)
    try {
      const res = await postDelete({
        password: password.trim(),
        reason: resolvedReason,
      }).unwrap()
      if (res.status === false) {
        setBanner({ type: 'err', text: res.message ?? 'Request failed.' })
        setConfirmOpen(false)
        return
      }
      setRequestSent(true)
      setConfirmOpen(false)
    } catch (err) {
      setBanner({ type: 'err', text: getRtkErrorMessage(err) })
      setConfirmOpen(false)
    }
  }

  if (requestSent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rp-success text-white">
          <span className="icon-tick text-2xl" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-rp-fg">Deletion request received</h2>
        <p className="max-w-md text-sm text-rp-muted">
          Your request will be reviewed. You will be contacted if we need more information.
        </p>
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h2 className="text-lg font-semibold text-rp-fg">Delete account</h2>
      {banner ? (
        <p
          role={banner.type === 'err' ? 'alert' : 'status'}
          className={banner.type === 'err' ? 'text-sm text-red-600' : 'text-sm text-rp-success'}
        >
          {banner.text}
        </p>
      ) : null}

      <p className="text-sm text-rp-fg">
        This will request deletion of the account for{' '}
        <span className="font-semibold text-yellow">{user?.email ?? 'your email'}</span>. Some data
        may be retained where required by law.
      </p>

      <div>
        <h3 className="mb-3 text-base font-semibold text-rp-fg">Why are you leaving?</h3>
        <div className="flex flex-col gap-3">
          {LEAVING_REASONS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setReasonIndex(index)
                setBanner(null)
                if (index !== LEAVING_REASONS.length - 1) {
                  setCustomReason('')
                }
              }}
              className="flex cursor-pointer items-start gap-2 text-left"
            >
              <span
                className={`mt-1.5 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 ${
                  reasonIndex === index ? 'border-yellow' : 'border-rp-border'
                }`}
                aria-hidden
              >
                {reasonIndex === index ? <span className="h-2 w-2 rounded-full bg-yellow" /> : null}
              </span>
              <span className="text-sm text-rp-fg">{label}</span>
            </button>
          ))}
        </div>
        {reasonIndex === LEAVING_REASONS.length - 1 ? (
          <textarea
            className="mt-3 min-h-[100px] w-full rounded-[10px] border border-rp-border bg-rp-input p-3 text-sm text-rp-fg focus:outline-none focus:ring-2 focus:ring-rp-accent"
            placeholder="Tell us more…"
            value={customReason}
            onChange={(e) => {
              setCustomReason(e.target.value)
              setBanner(null)
            }}
          />
        ) : null}
      </div>

      <InputField
        fieldType="password"
        id="rp-del-pw"
        name="password"
        label="Current password"
        autoComplete="current-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setBanner(null)
        }}
      />

      <div className="flex justify-end">
        <Button type="button" variant="destructive" onClick={handleRequestClick}>
          Delete account
        </Button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            disabled={isLoading}
            onClick={() => setConfirmOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-confirm-title"
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="del-confirm-title" className="text-lg font-semibold text-rp-fg">
              Send deletion request?
            </h2>
            <p className="mt-2 text-sm text-rp-muted">
              This submits a request to close your account. You can cancel from this dialog.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isLoading}
                onClick={submitDelete}
              >
                {isLoading ? 'Sending…' : 'Send request'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
