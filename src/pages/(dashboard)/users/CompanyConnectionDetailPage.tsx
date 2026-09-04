import { useNavigate, useParams } from 'react-router-dom'

import { MU } from '@/lib/manage-users-copy'

import { CompanyConnectionDetailCard } from './components/company-connection-detail-card'
import { useOwnerOnlyPage } from './use-owner-only-page'

/**
 * `/users/connections/:id` — one teammate's Microsoft connection detail.
 *
 * Reached from the eye icon on the Connections table, and the owner-facing
 * counterpart of the admin `/admin-recovery-connection-status/:id` screen.
 */
export function CompanyConnectionDetailPage() {
  useOwnerOnlyPage()
  const { id = '' } = useParams()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 bg-white p-3 sm:p-5">
      <div className="flex items-start gap-[10px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={MU.back}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-bottomBorder bg-white"
        >
          <span aria-hidden className="icon-arrow-left text-h5 text-black" />
        </button>
        <p className="text-large font-semibold leading-[33px] text-backTwo">
          {MU.connectionsTitle}
        </p>
      </div>

      <CompanyConnectionDetailCard userId={id} />
    </div>
  )
}
