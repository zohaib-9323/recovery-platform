import { Link } from 'react-router-dom'
import { Check, Eye, EyeOff, KeyRound } from 'lucide-react'

import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { SuccessPopup } from '@/components/popup'
import { Card, CardContent } from '@/components/ui/card'

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

type ResetPasswordViewProps = {
  newPassword: string
  confirmPassword: string
  showNewPassword: boolean
  showConfirmPassword: boolean
  error: string | null
  showSuccess: boolean
  checks: {
    length: boolean
    lower: boolean
    upper: boolean
    special: boolean
    digit: boolean
  }
  newPasswordError?: string
  confirmPasswordError?: string
  confirmPasswordTrimmed: string
  matches: boolean
  canSubmit: boolean
  isLoading: boolean
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onToggleShowNewPassword: () => void
  onToggleShowConfirmPassword: () => void
  onSubmit: () => Promise<unknown>
  onSuccessAction: () => void
  onSuccessClose: () => void
}

export function ResetPasswordView({
  newPassword,
  confirmPassword,
  showNewPassword,
  showConfirmPassword,
  error,
  showSuccess,
  checks,
  newPasswordError,
  confirmPasswordError,
  confirmPasswordTrimmed,
  matches,
  canSubmit,
  isLoading,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleShowNewPassword,
  onToggleShowConfirmPassword,
  onSubmit,
  onSuccessAction,
  onSuccessClose,
}: ResetPasswordViewProps) {
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

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void onSubmit()
            }}
            className="flex flex-col gap-4"
          >
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
                onChange={(e) => onNewPasswordChange(e.target.value)}
                error={newPasswordError}
                aria-invalid={Boolean(newPasswordError)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                    onClick={onToggleShowNewPassword}
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
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                error={confirmPasswordError}
                aria-invalid={Boolean(confirmPasswordError)}
                rightSlot={
                  <button
                    type="button"
                    className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                    onClick={onToggleShowConfirmPassword}
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
        onAction={onSuccessAction}
        onClose={onSuccessClose}
      />
    </>
  )
}
