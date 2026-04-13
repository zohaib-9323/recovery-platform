import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { logout } from '@/app/features/auth/authSlice'
import { usePostRecoveryChangePasswordMutation } from '@/app/services/recoveryApi'
import { useAppDispatch } from '@/app/redux-hooks'
import { InputField } from '@/components/fields'
import { Button } from '@/components/ui/button'
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
  const curT = currentPassword.trim()
  const newT = newPassword.trim()
  const sameAsCurrent = newT.length > 0 && curT.length > 0 && curT === newT
  const canSubmit = curT.length > 0 && newOk && match && !sameAsCurrent && !isLoading

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
        setBanner({ type: 'err', text: res.message ?? 'Could not change password.' })
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
      <h2 className="mb-2 text-xl font-semibold text-rp-fg">Change password</h2>
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
        label="Current password"
        type={showCur ? 'text' : 'password'}
        autoComplete="current-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-rp-muted hover:text-rp-fg"
            onClick={() => setShowCur((s) => !s)}
            aria-label={showCur ? 'Hide password' : 'Show password'}
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
        label="New password"
        description={PASSWORD_RULES_HINT}
        type={showNew ? 'text' : 'password'}
        autoComplete="new-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-rp-muted hover:text-rp-fg"
            onClick={() => setShowNew((s) => !s)}
            aria-label={showNew ? 'Hide password' : 'Show password'}
          >
            {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        value={newPassword}
        onChange={(e) => {
          setNew(e.target.value)
          setBanner(null)
        }}
        error={
          sameAsCurrent ? 'New password must be different from the current password.' : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <Pill ok={v.length}>Length ≥ 8</Pill>
        <Pill ok={v.lowercase}>Lowercase</Pill>
        <Pill ok={v.uppercase}>Uppercase</Pill>
        <Pill ok={v.digit}>Number</Pill>
        <Pill ok={v.special}>Special character</Pill>
      </div>

      <InputField
        fieldType="password"
        id="rp-cf-pw"
        name="confirmPassword"
        label="Confirm new password"
        type={showCf ? 'text' : 'password'}
        autoComplete="new-password"
        leftIcon={<KeyRound strokeWidth={2} />}
        rightSlot={
          <button
            type="button"
            className="text-rp-muted hover:text-rp-fg"
            onClick={() => setShowCf((s) => !s)}
            aria-label={showCf ? 'Hide password' : 'Show password'}
          >
            {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        value={confirmPassword}
        onChange={(e) => {
          setConfirm(e.target.value)
          setBanner(null)
        }}
        error={confirmPassword.length > 0 && !match ? 'Passwords do not match.' : undefined}
      />

      {match && confirmPassword.length > 0 ? (
        <p className="text-xs text-rp-success">Passwords match.</p>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!canSubmit}>
          {isLoading ? 'Updating…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}
