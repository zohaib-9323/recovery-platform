import { useMemo, useState } from 'react'

import { useRequestPasswordResetMutation } from '@/app/services/recoveryApi'
import { getErrorMessage } from '@/lib/api-errors'
import { requestPasswordResetSchema } from '@/lib/schemas/api'
import { isValidEmail } from '@/lib/validation'

export function useForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation()

  const trimmedEmail = email.trim()
  const emailError =
    trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
      ? 'Enter a valid email address.'
      : undefined
  const canSubmit = isValidEmail(trimmedEmail)

  const successDescription = useMemo(() => {
    if (!submittedEmail) return "We've sent an email with password reset instructions."
    return `We've sent an email with password reset information to ${submittedEmail}.`
  }, [submittedEmail])

  const onEmailChange = (value: string) => {
    setEmail(value.replace(/\s/g, ''))
    setError(null)
  }

  const submitResetRequest = async (): Promise<boolean> => {
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return false
    }
    setError(null)
    try {
      const payload = requestPasswordResetSchema.parse({ email: trimmedEmail })
      await requestReset(payload).unwrap()
      setSubmittedEmail(trimmedEmail)
      setShowSuccess(true)
      return true
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send reset link.'))
      return false
    }
  }

  const resendFromSuccess = async () => {
    const resendEmail = submittedEmail || trimmedEmail
    if (!isValidEmail(resendEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    try {
      const payload = requestPasswordResetSchema.parse({ email: resendEmail })
      await requestReset(payload).unwrap()
      setShowSuccess(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend reset link.'))
      setShowSuccess(false)
    }
  }

  return {
    email,
    emailError,
    canSubmit,
    error,
    isLoading,
    showSuccess,
    successDescription,
    onEmailChange,
    submitResetRequest,
    closeSuccess: () => setShowSuccess(false),
    resendFromSuccess,
  }
}
