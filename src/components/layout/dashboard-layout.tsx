import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bgColor">
      <AppSidebar />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <AppHeader />
        <main className="no-scrollbar flex-1 overflow-auto bg-bgColor">
          {/* <div className="mx-auto max-w-7xl rounded-lg border border-bottomBorder bg-white p-4 shadow-sm md:p-6 lg:p-8"> */}
          <Outlet />
          {/* </div> */}
        </main>
      </div>
    </div>
  )
}
