import { ForgotPasswordView } from '@/pages/auth/components/ForgotPasswordView'
import { useForgotPasswordForm } from '@/pages/auth/hooks/useForgotPasswordForm'

export function ForgotPasswordPage() {
  const form = useForgotPasswordForm()

  return (
    <ForgotPasswordView
      {...form}
      onSubmit={form.submitResetRequest}
      onSuccessAction={form.resendFromSuccess}
      onSuccessClose={form.closeSuccess}
    />
  )
}
