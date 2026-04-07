import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Eye, EyeOff, KeyRound } from 'lucide-react'

import { useResetPasswordMutation } from '@/app/services/recoveryApi'
import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { SuccessPopup } from '@/components/popup'
import { Card, CardContent } from '@/components/ui/card'
import { isValidPassword } from '@/lib/validation'

function readApiMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string' && message) return message
    }
  }
  return fallback
}

function RuleItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs ${ok ? 'text-[#22A45D]' : 'text-rp-description'}`}
    >
      <Check className="h-3.5 w-3.5" />
      {text}
    </span>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  if (!token) {
    return <Navigate to="/forgot-password" replace />
  }

  const newPasswordTrimmed = newPassword.trim()
  const confirmPasswordTrimmed = confirmPassword.trim()
  const matches = newPasswordTrimmed.length > 0 && newPasswordTrimmed === confirmPasswordTrimmed

  const checks = {
    length: newPasswordTrimmed.length >= 8,
    lower: /[a-z]/.test(newPasswordTrimmed),
    upper: /[A-Z]/.test(newPasswordTrimmed),
    special: /[^A-Za-z0-9]/.test(newPasswordTrimmed),
    digit: /\d/.test(newPasswordTrimmed),
  }

  const newPasswordError =
    newPasswordTrimmed.length > 0 && !isValidPassword(newPasswordTrimmed)
      ? 'Password must satisfy all rules below.'
      : undefined
  const confirmPasswordError =
    confirmPasswordTrimmed.length > 0 && !matches ? 'Passwords do not match.' : undefined

  const canSubmit = isValidPassword(newPasswordTrimmed) && matches

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      setError('Please fix the highlighted fields.')
      return
    }

    try {
      await resetPassword({ token, newPassword: newPasswordTrimmed }).unwrap()
      setShowSuccess(true)
    } catch (err) {
      setError(readApiMessage(err, 'Failed to reset password.'))
    }
  }

  return (
    <>
      <Card
        padding="none"
        className="box-border w-full max-w-[584px] rounded-[10px] border-0 bg-white p-5 shadow-[0_8px_24px_2px_rgba(0,0,0,0.059)]"
      >
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col items-center gap-3 text-center">
            <AppLogo size="lg" />
            <h1 className="text-4xl font-bold leading-tight text-rp-heading">Reset Password</h1>
            <p className="text-base text-rp-description">Create a new password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <InputField
                fieldType="password"
                id="new-password"
                name="new-password"
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound strokeWidth={2} />}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value.trim())
                  setError(null)
                }}
                error={newPasswordError}
                aria-invalid={Boolean(newPasswordError)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-5">
                <RuleItem ok={checks.length} text="Length 8+" />
                <RuleItem ok={checks.lower} text="1 small letter" />
                <RuleItem ok={checks.upper} text="1 capital letter" />
                <RuleItem ok={checks.special} text="1 special character" />
                <RuleItem ok={checks.digit} text="1 digit" />
              </div>
            </div>

            <div className="space-y-2">
              <InputField
                fieldType="password"
                id="confirm-password"
                name="confirm-password"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                leftIcon={<KeyRound strokeWidth={2} />}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value.trim())
                  setError(null)
                }}
                error={confirmPasswordError}
                aria-invalid={Boolean(confirmPasswordError)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />
              {confirmPasswordTrimmed ? (
                <p className={`text-xs ${matches ? 'text-[#22A45D]' : 'text-rp-description'}`}>
                  {matches ? 'Password matched successfully!' : 'Passwords do not match yet.'}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <LoginButton type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </LoginButton>
          </form>

          <p className="text-sm text-rp-description">
            Go back to login?{' '}
            <Link to="/login" className="font-semibold text-rp-heading hover:underline">
              Login ↗
            </Link>
          </p>
        </CardContent>
      </Card>

      <SuccessPopup
        open={showSuccess}
        title="Password Reset Successfully!"
        description="Login to your account with your new password."
        actionLabel="Login"
        onAction={() => navigate('/login', { replace: true })}
        onClose={() => setShowSuccess(false)}
      />
    </>
  )
}
