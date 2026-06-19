import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

export function DashboardLayout() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bgColor">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <AppHeader />
        <main className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden bg-bgColor">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
