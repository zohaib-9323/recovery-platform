import { Inbox, Package } from 'lucide-react'

import { ActionCard } from '@/components/dashboard/action-card'
import { ShipmentsDataTable } from '@/components/dashboard/shipments-data-table'
import { StatCard } from '@/components/dashboard/stat-card'
import { latestShipments, overviewKpis } from '@/data/mock/dashboard'

export function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-base font-semibold text-rp-fg">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewKpis.map(({ id, ...k }) => (
            <StatCard key={id} {...k} />
          ))}
        </div>
      </section>

      <ShipmentsDataTable title="Latest Shipments" rows={latestShipments} />

      <section>
        <h2 className="mb-4 text-base font-semibold text-rp-fg">Quick actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ActionCard title="View Shipments" description="106 active shipments" icon={Package} />
          <ActionCard title="Open Inbox" description="12 emails received today" icon={Inbox} />
        </div>
      </section>
    </div>
  )
}
