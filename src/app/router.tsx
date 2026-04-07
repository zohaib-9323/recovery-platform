import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useSessionRefresh } from '@/app/hooks/useSessionRefresh'
import { AuthLayout } from '@/components/layout/auth-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { RootRedirect } from '@/components/layout/root-redirect'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardHomePage } from '@/pages/(dashboard)/home/DashboardHomePage'
import { InboxPage } from '@/pages/(dashboard)/inbox/InboxPage'
import { AllShipmentsPage } from '@/pages/(dashboard)/shipments/AllShipmentsPage'

function SessionRefreshBoundary({ children }: { children: ReactNode }) {
  useSessionRefresh()
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <SessionRefreshBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
      </SessionRefreshBoundary>
    </BrowserRouter>
  )
}
