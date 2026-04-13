import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { logout } from '@/app/features/auth/authSlice'
import { usePostRecoveryChangePasswordMutation } from '@/app/services/recoveryApi'
import { useAppDispatch } from '@/app/redux-hooks'
import { InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { isValidPassword, PASSWORD_RULES_HINT } from '@/lib/validation'
import { cn } from '@/lib/utils'

function ruleStatus(p: string) {
  return {
    length: p.length >= 8,
    lowercase: /[a-z]/.test(p),
    uppercase: /[A-Z]/.test(p),
    digit: /\d/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  }
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rp-surface text-rp-muted',
      )}
    >
      {children}
    </span>
  )
}

export function SecurityTab() {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [changePassword, { isLoading }] = usePostRecoveryChangePasswordMutation()

  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const rules = ruleStatus(newPassword)
  const newOk = isValidPassword(newPassword)
  const match = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmit = currentPassword.trim().length > 0 && newOk && match && !isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)
    if (!canSubmit) return
    try {
      const res = await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      }).unwrap()
      if (res.status === false) {
        setBanner({ type: 'err', text: res.message ?? t('settings.security.changeFailed') })
        return
      }
      dispatch(logout())
      navigate('/login', { replace: true })
    } catch (err) {
      setBanner({ type: 'err', text: getRtkErrorMessage(err) })
    }
  }

  const v = rules

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <h2 className="mb-2 text-xl font-semibold text-rp-fg">{t('settings.security.title')}</h2>
      {banner ? (
        <p
          role={banner.type === 'err' ? 'alert' : 'status'}
          className={banner.type === 'err' ? 'text-sm text-red-600' : 'text-sm text-rp-success'}
        >
          {banner.text}
        </p>
      ) : null}

      <InputField
        fieldType="password"
        id="rp-cur-pw"
        name="currentPassword"
        label={t('settings.security.currentPassword')}
        type={showCur ? 'text' : 'password'}
        autoComplete="current-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-rp-muted hover:text-rp-fg"
            onClick={() => setShowCur((s) => !s)}
            aria-label={showCur ? t('common.hidePassword') : t('common.showPassword')}
          >
            {showCur ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        value={currentPassword}
        onChange={(e) => {
          setCurrent(e.target.value)
          setBanner(null)
        }}
      />

      <InputField
        fieldType="password"
        id="rp-new-pw"
        name="newPassword"
        label={t('settings.security.newPassword')}
        description={PASSWORD_RULES_HINT}
        type={showNew ? 'text' : 'password'}
        autoComplete="new-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-rp-muted hover:text-rp-fg"
            onClick={() => setShowNew((s) => !s)}
            aria-label={showNew ? t('common.hidePassword') : t('common.showPassword')}
          >
            {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        value={newPassword}
        onChange={(e) => {
          setNew(e.target.value)
          setBanner(null)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Pill ok={v.length}>{t('settings.security.rule.length')}</Pill>
        <Pill ok={v.lowercase}>{t('settings.security.rule.lowercase')}</Pill>
        <Pill ok={v.uppercase}>{t('settings.security.rule.uppercase')}</Pill>
        <Pill ok={v.digit}>{t('settings.security.rule.number')}</Pill>
        <Pill ok={v.special}>{t('settings.security.rule.special')}</Pill>
      </div>

      <InputField
        fieldType="password"
        id="rp-cf-pw"
        name="confirmPassword"
        label={t('settings.security.confirmNewPassword')}
        type={showCf ? 'text' : 'password'}
        autoComplete="new-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-rp-muted hover:text-rp-fg"
            onClick={() => setShowCf((s) => !s)}
            aria-label={showCf ? t('common.hidePassword') : t('common.showPassword')}
          >
            {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        value={confirmPassword}
        onChange={(e) => {
          setConfirm(e.target.value)
          setBanner(null)
        }}
        error={confirmPassword.length > 0 && !match ? t('settings.security.notMatch') : undefined}
      />

      {match && confirmPassword.length > 0 ? (
        <p className="text-xs text-rp-success">{t('settings.security.match')}</p>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!canSubmit}>
          {isLoading ? t('settings.security.updating') : t('settings.security.submit')}
        </Button>
      </div>
    </form>
  )
}
