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
import { SignupPage } from '@/pages/auth/signup/SignupPage'
import { AcceptInvitePage } from '@/pages/auth/AcceptInvitePage'
import { DashboardHomePage } from '@/pages/(dashboard)/home/DashboardHomePage'
import { InboxPage } from '@/pages/(dashboard)/inbox/InboxPage'
import { ImportsPage } from '@/pages/(dashboard)/imports/ImportsPage'
import { ImportJobDetailPage } from '@/pages/(dashboard)/imports/ImportJobDetailPage'
import { ProcessableShipmentsPage } from '@/pages/(dashboard)/imports/ProcessableShipmentsPage'
import { UnprocessedDocumentsPage } from '@/pages/(dashboard)/imports/UnprocessedDocumentsPage'
import { NotificationsPage } from '@/pages/(dashboard)/notifications/NotificationsPage'
import { AllShipmentsPage } from '@/pages/(dashboard)/shipments/AllShipmentsPage'
import { ShipmentDetailPageV2 as ShipmentDetailPage } from '@/pages/(dashboard)/shipments/ShipmentDetailPageV2'
import { ShipmentLogsPage } from '@/pages/(dashboard)/shipments/ShipmentLogsPage'
import { SettingsPage } from '@/pages/(dashboard)/settings/SettingsPage'
import { CompanyConnectionDetailPage } from '@/pages/(dashboard)/users/CompanyConnectionDetailPage'
import { CompanyConnectionsPage } from '@/pages/(dashboard)/users/CompanyConnectionsPage'
import { CompanyDeleteRequestsPage } from '@/pages/(dashboard)/users/CompanyDeleteRequestsPage'
import { ManageUsersPage } from '@/pages/(dashboard)/users/ManageUsersPage'
import { UserDetailPage } from '@/pages/(dashboard)/users/UserDetailPage'

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
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
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
                <Route path="/shipments/:id/logs" element={<ShipmentLogsPage />} />
                <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/users" element={<ManageUsersPage />} />
                {/*
                  Registered before "/users/:id" so the literal paths win — a
                  param route placed first would swallow them and try to load a
                  user whose id is "connections".
                */}
                <Route path="/users/connections" element={<CompanyConnectionsPage />} />
                <Route path="/users/connections/:id" element={<CompanyConnectionDetailPage />} />
                <Route path="/users/deletion-requests" element={<CompanyDeleteRequestsPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/imports" element={<ImportsPage />} />
                {/* Listed before /imports/:id for readability. React Router v6
                    ranks static segments above dynamic ones regardless of
                    order, so these are not shadowed by the :id route. */}
                <Route
                  path="/imports/processable-shipments"
                  element={<ProcessableShipmentsPage />}
                />
                <Route
                  path="/imports/unprocessed-documents"
                  element={<UnprocessedDocumentsPage />}
                />
                <Route path="/imports/:id" element={<ImportJobDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
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
