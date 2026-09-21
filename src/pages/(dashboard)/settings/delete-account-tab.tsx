import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

import {
  useGetRecoveryDeleteRequestStatusQuery,
  usePostRecoveryDeleteRequestMutation,
} from '@/app/services/recoveryApi'
import { RECOVERY_COMPANY_OWNER } from '@/types/roles'
import { useAuth } from '@/app/hooks/useAuth'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import type { RecoveryDeleteRequestStatus } from '@/types/recovery-user-api'

import { LEAVING_REASONS } from './settings-constants'

function hasPendingDeleteRequest(content: RecoveryDeleteRequestStatus | undefined): boolean {
  if (!content) return false
  if (content.hasPendingRequest === true) return true
  if (content.data?.hasPendingRequest === true) return true
  return false
}

export function DeleteAccountTab() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [postDelete, { isLoading }] = usePostRecoveryDeleteRequestMutation()
  const {
    data: pendingData,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
  } = useGetRecoveryDeleteRequestStatusQuery()

  const [reasonIndex, setReasonIndex] = useState(0)
  const [customReason, setCustomReason] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [requestSent, setRequestSent] = useState(hasPendingDeleteRequest(pendingData?.content))
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const requestAlreadyPending = requestSent || hasPendingDeleteRequest(pendingData?.content)
  const pendingCheckLoading = pendingLoading || pendingFetching

  const resolvedReason =
    reasonIndex === LEAVING_REASONS.length - 1 ? customReason.trim() : LEAVING_REASONS[reasonIndex]

  const canOpenConfirm =
    password.trim().length > 0 &&
    (reasonIndex !== LEAVING_REASONS.length - 1 || customReason.trim().length > 0)

  const handleRequestClick = () => {
    if (requestAlreadyPending) return
    setBanner(null)
    if (!canOpenConfirm) {
      setBanner({
        type: 'err',
        text:
          reasonIndex === LEAVING_REASONS.length - 1 && !customReason.trim()
            ? t('settings.delete.describeReason')
            : t('settings.delete.enterPassword'),
      })
      return
    }
    setConfirmOpen(true)
  }

  const submitDelete = async () => {
    if (requestAlreadyPending) return
    setBanner(null)
    try {
      const res = await postDelete({
        password: password.trim(),
        reason: resolvedReason,
      }).unwrap()
      if (res.status === false) {
        setBanner({ type: 'err', text: res.message ?? t('settings.delete.requestFailed') })
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

  if (pendingCheckLoading && !requestAlreadyPending) {
    return <CustomLoader />
  }

  if (requestAlreadyPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rp-success text-white">
          <span className="icon-tick text-2xl" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-rp-fg">{t('settings.delete.requestReceived')}</h2>
        <p className="max-w-md text-sm text-rp-muted">
          {t('settings.delete.requestReceivedDescription')}
        </p>
        {/*
          A Company User's request is reviewed by their Company Owner; an
          owner's goes to the platform admin. Naming the reviewer stops
          someone waiting on the wrong person.
        */}
        <p className="max-w-md text-sm text-rp-muted">
          {user?.role === RECOVERY_COMPANY_OWNER
            ? t('settings.delete.reviewedByAdmin')
            : t('settings.delete.reviewedByOwner')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h2 className="text-lg font-semibold text-rp-fg">{t('settings.delete.title')}</h2>
      {banner ? (
        <p
          role={banner.type === 'err' ? 'alert' : 'status'}
          className={banner.type === 'err' ? 'text-sm text-red-600' : 'text-sm text-rp-success'}
        >
          {banner.text}
        </p>
      ) : null}

      <p className="text-sm text-rp-fg">
        {t('settings.delete.summaryPrefix')}{' '}
        <span className="font-semibold text-yellow">
          {user?.email ?? t('settings.delete.summaryFallbackEmail')}
        </span>
        {t('settings.delete.summarySuffix')}
      </p>

      <div>
        <h3 className="mb-3 text-base font-semibold text-rp-fg">
          {t('settings.delete.whyLeaving')}
        </h3>
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
            placeholder={t('settings.delete.customReasonPlaceholder')}
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
        label={t('settings.delete.currentPassword')}
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-primary hover:text-primary/90"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setBanner(null)
        }}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={handleRequestClick}
          disabled={requestAlreadyPending}
        >
          {t('settings.delete.requestButton')}
        </Button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('settings.delete.confirmCloseDialog')}
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
              {t('settings.delete.confirmTitle')}
            </h2>
            <p className="mt-2 text-sm text-rp-muted">{t('settings.delete.confirmDescription')}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => setConfirmOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isLoading}
                onClick={submitDelete}
              >
                {isLoading ? t('settings.delete.sending') : t('settings.delete.sendRequest')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
