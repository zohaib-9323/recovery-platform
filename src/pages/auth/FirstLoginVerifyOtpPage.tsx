import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useI18n } from '@/i18n/useI18n'
import {
  OtpVerificationForm,
  type OtpVerifiedResult,
} from '@/pages/auth/components/OtpVerificationForm'
import { PasswordSuccessPopup } from '@/pages/auth/components/PasswordSuccessPopup'
import {
  clearFirstLoginFlowState,
  readFirstLoginFlowState,
  saveFirstLoginFlowState,
  type FirstLoginFlowState,
} from '@/pages/auth/first-login-flow'
import { SignupStepper } from '@/pages/auth/signup/SignupStepper'

function getStateFromLocation(locationState: unknown): FirstLoginFlowState | null {
  if (!locationState || typeof locationState !== 'object') return null
  const email = (locationState as { email?: unknown }).email
  const setupToken = (locationState as { setupToken?: unknown }).setupToken
  const fromSignup = (locationState as { fromSignup?: unknown }).fromSignup

  if (typeof email !== 'string' || email.trim().length === 0) return null

  return {
    email: email.trim(),
    setupToken:
      typeof setupToken === 'string' && setupToken.trim().length > 0 ? setupToken : undefined,
    fromSignup: fromSignup === true,
  }
}

/**
 * Standalone `/first-login/verify-otp` route — still used by the existing-user
 * first-login flow (temporary password from `LoginPage`) and as a fallback for
 * anyone who lands here directly with a signup flow already saved in
 * `sessionStorage`. The signup flow itself no longer navigates here: its OTP
 * step renders in place on `SignupPage` using the same `OtpVerificationForm`.
 */
export function FirstLoginVerifyOtpPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSignupVerifiedPopup, setShowSignupVerifiedPopup] = useState(false)

  const flowState = useMemo(() => {
    const fromLocation = getStateFromLocation(location.state)
    if (fromLocation) return fromLocation
    return readFirstLoginFlowState()
  }, [location.state])

  useEffect(() => {
    if (flowState) saveFirstLoginFlowState(flowState)
  }, [flowState])

  if (!flowState) {
    return <Navigate to="/login" replace />
  }

  const handleVerified = (result: OtpVerifiedResult) => {
    if (result.fromSignup) {
      clearFirstLoginFlowState()
      setShowSignupVerifiedPopup(true)
      return
    }

    const nextState: FirstLoginFlowState = { email: flowState.email, setupToken: result.setupToken }
    saveFirstLoginFlowState(nextState)
    navigate('/first-login/setup-password', { replace: true, state: nextState })
  }

  return (
    <>
      <div className="h-full w-full px-5 sm:px-7 md:px-10">
        <div className="flex h-full w-full flex-col justify-center gap-2">
          <SignupStepper activeStep="email-verification" className="mb-4" />
          <OtpVerificationForm
            email={flowState.email}
            fromSignup={flowState.fromSignup === true}
            onVerified={handleVerified}
          />
        </div>
      </div>

      {showSignupVerifiedPopup ? (
        <PasswordSuccessPopup
          title={t('auth.signup.otp.successTitle')}
          description={t('auth.signup.otp.successDescription')}
          actionLabel={t('auth.signup.otp.successAction')}
          onAction={() => navigate('/login', { replace: true })}
        />
      ) : null}
    </>
  )
}
