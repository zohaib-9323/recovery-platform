import { CompanyConnectionsCard } from './components/company-connections-card'
import { useOwnerOnlyPage } from './use-owner-only-page'

/**
 * `/users/connections` — Microsoft connection status for the owner's team.
 *
 * A standalone page rather than a tab: it is reached from its own sidebar
 * entry under Manage Users.
 */
export function CompanyConnectionsPage() {
  useOwnerOnlyPage()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 bg-white p-3 sm:p-5">
      <CompanyConnectionsCard />
    </div>
  )
}
