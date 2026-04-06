import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthLayout } from '@/components/layout/auth-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { RootRedirect } from '@/components/layout/root-redirect'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardHomePage } from '@/pages/(dashboard)/home/DashboardHomePage'
import { InboxPage } from '@/pages/(dashboard)/inbox/InboxPage'
import { AllShipmentsPage } from '@/pages/(dashboard)/shipments/AllShipmentsPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/shipments" element={<Navigate to="/shipments" replace />} />
          <Route path="/dashboard/inbox" element={<Navigate to="/inbox" replace />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHomePage />} />
            <Route path="/shipments" element={<AllShipmentsPage />} />
            <Route path="/inbox" element={<InboxPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
