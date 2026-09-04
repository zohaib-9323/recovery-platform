import { CompanyDeleteRequestsCard } from './components/company-delete-requests-card'
import { useOwnerOnlyPage } from './use-owner-only-page'

/** `/users/deletion-requests` — the owner's deletion-request queue. */
export function CompanyDeleteRequestsPage() {
  useOwnerOnlyPage()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 bg-white p-3 sm:p-5">
      <CompanyDeleteRequestsCard />
    </div>
  )
}
