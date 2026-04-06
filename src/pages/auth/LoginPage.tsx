import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react'

import { setCredentials } from '@/app/features/auth/authSlice'
import { useAppDispatch } from '@/app/redux-hooks'
import { AppLogo } from '@/components/brand/app-logo'
import { LoginButton } from '@/components/buttons'
import { InputField } from '@/components/fields'
import { Card, CardContent } from '@/components/ui/card'
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/config/auth'
import { useAuth } from '@/app/hooks/useAuth'
import { isValidEmail, isValidPassword, PASSWORD_RULES_HINT } from '@/lib/validation'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const trimmedEmail = email.trim()
  const trimmedPassword = password.trim()
  const emailError =
    trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
      ? 'Enter a valid email address.'
      : undefined
  const passwordError =
    trimmedPassword.length > 0 && !isValidPassword(trimmedPassword)
      ? PASSWORD_RULES_HINT
      : undefined

  const canSubmit =
    trimmedEmail.length > 0 &&
    trimmedPassword.length > 0 &&
    isValidEmail(trimmedEmail) &&
    isValidPassword(trimmedPassword)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(trimmedEmail) || !isValidPassword(trimmedPassword)) {
      setError('Please correct the highlighted fields.')
      return
    }

    if (trimmedEmail !== DEMO_EMAIL || trimmedPassword !== DEMO_PASSWORD) {
      setError('Invalid email or password.')
      return
    }

    dispatch(
      setCredentials({
        user: {
          id: 'usr_demo',
          email: trimmedEmail,
          displayName: 'Recovery Analyst',
        },
        token: 'demo-token',
      }),
    )
    navigate(from, { replace: true })
  }

  return (
    <Card
      padding="none"
      className="box-border min-h-[450.720703125px] w-full max-w-[584px] rounded-[10px] border-0 bg-white p-5 shadow-[0_8px_24px_2px_rgba(0,0,0,0.059)]"
    >
      <CardContent className="flex flex-col gap-[10px] p-0">
        <div className="flex flex-col items-center gap-[10px] text-center">
          <AppLogo size="lg" />
          <h1 className="text-2xl font-bold text-rp-heading">Recovery Platform</h1>
          <p className="text-sm text-rp-description">Email Document Intake Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
          <InputField
            fieldType="email"
            id="email"
            name="email"
            label="Email Address"
            autoComplete="email"
            leftIcon={<Mail strokeWidth={2} />}
            placeholder="Enter Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value.replace(/\s/g, ''))
              setError(null)
            }}
            error={emailError}
            aria-invalid={Boolean(emailError)}
          />

          <div className="flex flex-col gap-2">
            <InputField
              fieldType="password"
              id="password"
              name="password"
              label="Password"
              description={PASSWORD_RULES_HINT}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              leftIcon={<KeyRound strokeWidth={2} />}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value.trim())
                setError(null)
              }}
              error={passwordError}
              aria-invalid={Boolean(passwordError)}
              rightSlot={
                <button
                  type="button"
                  className="rounded p-1 text-rp-icon hover:bg-rp-accent/10"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />
            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-rp-icon hover:underline">
                Forgot Password?
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <LoginButton type="submit" disabled={!canSubmit}>
            Login
          </LoginButton>

          <p className="text-center text-xs text-rp-muted">
            Demo: <span className="font-mono text-rp-fg">{DEMO_EMAIL}</span> /{' '}
            <span className="font-mono text-rp-fg">{DEMO_PASSWORD}</span>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
