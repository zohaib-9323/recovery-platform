import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { ResetPasswordView } from '@/pages/auth/components/ResetPasswordView'
import { useResetPasswordForm } from '@/pages/auth/hooks/useResetPasswordForm'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const form = useResetPasswordForm({ token })

  if (!token) {
    return <Navigate to="/forgot-password" replace />
  }

  return (
    <ResetPasswordView
      {...form}
      onNewPasswordChange={form.setNewPassword}
      onConfirmPasswordChange={form.setConfirmPassword}
      onToggleShowNewPassword={form.toggleShowNewPassword}
      onToggleShowConfirmPassword={form.toggleShowConfirmPassword}
      onSubmit={form.submit}
      onSuccessAction={() => navigate('/login', { replace: true })}
      onSuccessClose={form.closeSuccess}
    />
  )
}
