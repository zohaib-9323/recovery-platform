import { useMemo, useState } from 'react'

import { useResetPasswordMutation } from '@/app/services/recoveryApi'
import { getErrorMessage } from '@/lib/api-errors'
import { resetPasswordSchema } from '@/lib/schemas/api'
import { isValidPassword } from '@/lib/validation'

type UseResetPasswordFormArgs = {
  token: string
}

export function useResetPasswordForm({ token }: UseResetPasswordFormArgs) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const newPasswordTrimmed = newPassword.trim()
  const confirmPasswordTrimmed = confirmPassword.trim()
  const matches = newPasswordTrimmed.length > 0 && newPasswordTrimmed === confirmPasswordTrimmed

  const checks = useMemo(
    () => ({
      length: newPasswordTrimmed.length >= 8,
      lower: /[a-z]/.test(newPasswordTrimmed),
      upper: /[A-Z]/.test(newPasswordTrimmed),
      special: /[^A-Za-z0-9]/.test(newPasswordTrimmed),
      digit: /\d/.test(newPasswordTrimmed),
    }),
    [newPasswordTrimmed],
  )

  const newPasswordError =
    newPasswordTrimmed.length > 0 && !isValidPassword(newPasswordTrimmed)
      ? 'Password must satisfy all rules below.'
      : undefined
  const confirmPasswordError =
    confirmPasswordTrimmed.length > 0 && !matches ? 'Passwords do not match.' : undefined
  const canSubmit = isValidPassword(newPasswordTrimmed) && matches

  const submit = async (): Promise<boolean> => {
    setError(null)
    if (!canSubmit) {
      setError('Please fix the highlighted fields.')
      return false
    }
    try {
      const payload = resetPasswordSchema.parse({ token, newPassword: newPasswordTrimmed })
      await resetPassword(payload).unwrap()
      setShowSuccess(true)
      return true
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password.'))
      return false
    }
  }

  return {
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
    setNewPassword: (value: string) => {
      setNewPassword(value.trim())
      setError(null)
    },
    setConfirmPassword: (value: string) => {
      setConfirmPassword(value.trim())
      setError(null)
    },
    toggleShowNewPassword: () => setShowNewPassword((s) => !s),
    toggleShowConfirmPassword: () => setShowConfirmPassword((s) => !s),
    submit,
    closeSuccess: () => setShowSuccess(false),
  }
}
