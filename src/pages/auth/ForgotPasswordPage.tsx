import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

import { useRequestPasswordResetMutation } from '@/app/services/recoveryApi'
import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { SuccessPopup } from '@/components/popup'
import { Card, CardContent } from '@/components/ui/card'
import { isValidEmail } from '@/lib/validation'

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

export function ForgotPasswordPage() {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      await requestReset({ email: trimmedEmail }).unwrap()
      setSubmittedEmail(trimmedEmail)
      setShowSuccess(true)
    } catch (err) {
      setError(readApiMessage(err, 'Failed to send reset link.'))
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
            <h1 className="text-4xl font-bold leading-tight text-rp-heading">Forgot Password?</h1>
            <p className="max-w-[430px] text-base text-rp-description">
              Enter the email you used to create your account so we can send you a link for
              resetting your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              fieldType="email"
              id="forgot-email"
              name="forgot-email"
              label="Email Address"
              autoComplete="email"
              leftIcon={<Mail strokeWidth={2} />}
              placeholder="johndoe@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.replace(/\s/g, ''))
                setError(null)
              }}
              error={emailError}
              aria-invalid={Boolean(emailError)}
            />

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <LoginButton type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
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
        title="Check Your Email!"
        description={successDescription}
        actionLabel="Resend Email"
        onAction={() => {
          setShowSuccess(false)
          void requestReset({ email: submittedEmail || trimmedEmail })
        }}
        onClose={() => setShowSuccess(false)}
      />
    </>
  )
}
