---
name: rp-rbac-check
description: >
  Verify that every new or modified route in recovery-platform is wrapped in the correct
  layout/guard component. Use this skill whenever you add a new page route to AppRouter,
  create a new page component, add a new auth flow screen, or review any code that touches
  routing/auth. Prevents routes from being accidentally left unprotected or unreachable.
  Triggers on: "add a new page", "new route", "protect this route", "auth guard", "guest
  route", "ProtectedRoute", "router.tsx", "add a page to the dashboard", or editing
  src/app/router.tsx.
---

# rp-rbac-check — Recovery Platform

Recovery Platform uses React Router v6 with layout-based route guards. Authentication
is enforced by layout components — pages themselves don't contain auth logic.
This is cleaner than trade-harmonizer's per-page `useEffect` approach.

---

## Route guard architecture

```
AppRouter
└── TenantValidationGuard        ← validates subdomain, redirects to /invalid-subdomain
    ├── /invalid-subdomain       ← no auth needed
    ├── /                        ← RootRedirect (redirects to /dashboard or /login)
    ├── GuestRoute               ← redirects to /dashboard if already logged in
    │   └── AuthLayout
    │       ├── /login
    │       ├── /forgot-password
    │       ├── /reset-password
    │       ├── /first-login/verify-otp
    │       └── /first-login/setup-password
    └── ProtectedRoute           ← redirects to /login if NOT authenticated
        └── DashboardLayout
            ├── /dashboard
            ├── /shipments
            ├── /shipments/:id
            ├── /inbox
            └── /settings
```

Auth state: `state.auth.token` + `state.auth.user` in Redux store (`authSlice.ts`).

---

## Adding a new route — the checklist

### New dashboard/authenticated page

Add it inside the `<ProtectedRoute>` block in `src/app/router.tsx`:

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<DashboardLayout />}>
    {/* existing routes */}
    <Route path="/your-new-page" element={<YourNewPage />} />
  </Route>
</Route>
```

Checklist:

- [ ] Route is nested inside `<ProtectedRoute />` — unauthenticated users will be redirected to `/login`
- [ ] Route is nested inside `<DashboardLayout />` — gives it the sidebar/nav shell
- [ ] Page component is imported at the top of `router.tsx`
- [ ] Page component is a named export (not default) from `src/pages/(dashboard)/`
- [ ] `TenantValidationGuard` is an ancestor — always true if nested inside existing routes

### New auth page (guest-only)

Add inside the `<GuestRoute>` block:

```tsx
<Route element={<GuestRoute />}>
  <Route element={<AuthLayout />}>
    {/* existing auth routes */}
    <Route path="/your-auth-page" element={<YourAuthPage />} />
  </Route>
</Route>
```

Checklist:

- [ ] Route is inside `<GuestRoute />` — authenticated users get redirected away
- [ ] Route is inside `<AuthLayout />` — gives it the auth page shell
- [ ] Page lives in `src/pages/auth/`
- [ ] `TenantValidationGuard` still applies (subdomain must be valid)

### Route that needs no auth AND no guest redirect

Add directly inside `<TenantValidationGuard>` but outside both `GuestRoute` and `ProtectedRoute`. Currently only `/invalid-subdomain` fits this pattern — use it sparingly.

---

## Guard component responsibilities

### `ProtectedRoute`

Reads `state.auth.token`. If null → redirects to `/login`. Renders `<Outlet />` if authenticated.
File: `src/components/layout/protected-route.tsx`

### `GuestRoute`

Reads `state.auth.token`. If set → redirects to `/dashboard`. Renders `<Outlet />` if unauthenticated.
File: `src/components/layout/guest-route.tsx`

### `TenantValidationGuard`

Validates the current subdomain against the backend. If invalid → redirects to `/invalid-subdomain`.
File: `src/components/layout/tenant-validation-guard.tsx`

---

## Session lifecycle

| Event            | What happens                                                                      |
| ---------------- | --------------------------------------------------------------------------------- |
| Successful login | `applyTokens` dispatched → `auth.token` + `auth.user` set                         |
| Token refresh    | `refreshSession` called in reauth middleware → tokens updated silently            |
| 401 on API call  | `runBaseQueryWithReauth` attempts refresh; if refresh fails → `logout` dispatched |
| Logout           | `logout` dispatched → `auth.token` null → `ProtectedRoute` redirects to `/login`  |
| First login      | Flow: `/first-login/verify-otp` → `/first-login/setup-password` → `/login`        |

---

## Common mistakes to catch

1. **Page added outside `ProtectedRoute`** — renders without auth check; unauthenticated users can access it directly
2. **Page added outside `DashboardLayout`** — authenticated pages missing the sidebar/nav chrome
3. **Auth page added outside `GuestRoute`** — logged-in users can re-visit login screen
4. **Redirect legacy paths omitted** — if you rename a route, add a `<Navigate>` from the old path to the new one (see `/dashboard/shipments` → `/shipments` in the existing router)
5. **Page file as default export** — router imports are named exports; default exports won't tree-shake correctly with the current pattern

---

## No per-page role guards (yet)

Recovery Platform v1 has a single user role. All authenticated users have the same
access level. If role-based feature flags are added in the future:

- Add role fields to `User` type in `src/types/`
- Add a `RequireRole` layout wrapper (similar to `ProtectedRoute`) in `src/components/layout/`
- Do NOT add `useEffect`-based redirects inside page components — keep guards at the router level
