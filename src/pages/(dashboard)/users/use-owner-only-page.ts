import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppSelector } from '@/app/redux-hooks'
import { MU } from '@/lib/manage-users-copy'
import { showCustomToast } from '@/lib/showCustomToast'
import { RECOVERY_COMPANY_OWNER } from '@/types/roles'

/**
 * Bounces a non-owner off a Manage Users page.
 *
 * Extracted so each of the separate pages under `/users` gates the same way
 * instead of each re-implementing it — a page that forgot would render an
 * empty shell to a Company User rather than redirecting. This is presentation
 * only: every endpoint behind these pages carries the same role guard
 * server-side, which is what actually protects the data.
 */
export function useOwnerOnlyPage() {
  const navigate = useNavigate()
  const currentUser = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    if (currentUser && currentUser.role !== RECOVERY_COMPANY_OWNER) {
      showCustomToast({
        type: 'error',
        title: MU.notAuthorizedTitle,
        message: MU.notAuthorizedMessage,
      })
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])
}
