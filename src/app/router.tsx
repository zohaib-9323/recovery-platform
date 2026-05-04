import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useSessionRefresh } from '@/app/hooks/useSessionRefresh'
import { AuthLayout } from '@/components/layout/auth-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { GuestRoute } from '@/components/layout/guest-route'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { RootRedirect } from '@/components/layout/root-redirect'
import { TenantValidationGuard } from '@/components/layout/tenant-validation-guard'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { FirstLoginSetupPasswordPage } from '@/pages/auth/FirstLoginSetupPasswordPage'
import { FirstLoginVerifyOtpPage } from '@/pages/auth/FirstLoginVerifyOtpPage'
import { InvalidSubdomainPage } from '@/pages/auth/InvalidSubdomainPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardHomePage } from '@/pages/(dashboard)/home/DashboardHomePage'
import { InboxPage } from '@/pages/(dashboard)/inbox/InboxPage'
import { AllShipmentsPage } from '@/pages/(dashboard)/shipments/AllShipmentsPage'
import { ShipmentDetailPageV2 as ShipmentDetailPage } from '@/pages/(dashboard)/shipments/ShipmentDetailPageV2'
import { SettingsPage } from '@/pages/(dashboard)/settings/SettingsPage'

function SessionRefreshBoundary({ children }: { children: ReactNode }) {
  useSessionRefresh()
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <SessionRefreshBoundary>
        <Routes>
          <Route path="/invalid-subdomain" element={<InvalidSubdomainPage />} />

          <Route element={<TenantValidationGuard />}>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/first-login/verify-otp" element={<FirstLoginVerifyOtpPage />} />
                <Route
                  path="/first-login/setup-password"
                  element={<FirstLoginSetupPasswordPage />}
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/shipments" element={<Navigate to="/shipments" replace />} />
              <Route path="/dashboard/inbox" element={<Navigate to="/inbox" replace />} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardHomePage />} />
                <Route path="/shipments" element={<AllShipmentsPage />} />
                <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SessionRefreshBoundary>
    </BrowserRouter>
  )
}
