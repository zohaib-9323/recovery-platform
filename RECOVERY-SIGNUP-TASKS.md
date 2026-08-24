# Recovery Platform — Self-Signup & Multi-User Company Tasks (Frontend)

Status: **planning only — nothing in this doc is implemented yet.**
Repo: `Recovery-Platform`. Companion docs: [`trade-harmonizer-be/RECOVERY-SIGNUP-TASKS.md`](../trade-harmonizer-be/RECOVERY-SIGNUP-TASKS.md) (backend — read first, contracts and role model land there), [`trade-harmonizer/RECOVERY-SIGNUP-TASKS.md`](../trade-harmonizer/RECOVERY-SIGNUP-TASKS.md).

## Client decisions this implements

1. Self-service signup only — no manual admin-invite flow. Same journey as
   `trade-harmonizer`'s registration, minus the subscription/payment step.
2. First signup from a company domain becomes **Company Owner**; subsequent
   signups from the same domain join as **Company User** under the same
   company. Each person gets their own login. Reuse the main platform's
   Company Owner / Company User UX pattern (`docs/architecture/authentication.md`
   in `trade-harmonizer`) rather than inventing Recovery-specific roles.

## Current state (confirmed by reading the repo)

- `src/pages/auth/` has **no signup/registration page at all** — only
  `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`,
  `FirstLoginVerifyOtpPage.tsx`/`FirstLoginSetupPasswordPage.tsx` (password
  setup for _admin-created_ accounts — a different flow from what we're
  building), and `InvalidSubdomainPage.tsx`.
- `src/app/services/recoveryApi.ts` only defines `login`,
  `request-password-reset`, `reset-password`, `first-login/verify-otp`,
  `first-login/request-otp`, `first-login/setup-password`, `change-password`.
  No register/signup-OTP endpoints — these land in the backend task list first.
- There is **no role concept anywhere in this frontend** (`grep` for
  `company_owner`/`company_user`/role-gating turned up nothing outside a few
  unrelated component prop names) — this repo currently assumes exactly one
  undifferentiated user type. Role-awareness is new work, not an extension of
  something existing.
- `src/app/features/auth/authSlice.ts` holds no `role`/`company` fields today.
- Session storage: `docs/adr/0001-auth-session-strategy.md` — sessionStorage
  envelope (`recovery_platform_auth_v2`), capped at 12h. Signup should persist
  through this same mechanism once verified, not a new one.

## Frontend implementation tasks

1. **Signup route + step flow**, mirroring `trade-harmonizer`'s
   `src/app/(auth)/(signup)/registration/` (personal-information →
   email-verification → account-created) **minus** its `payment-plan` step:
   - `src/pages/auth/SignupPage.tsx` (or a `signup/` sub-folder if the step
     components warrant separate files, matching the `registration/` folder
     split in `trade-harmonizer`).
   - Step 1 — personal + company info form: firstName, lastName, email,
     phone, password (reuse `src/pages/auth/components/PasswordRules.tsx`,
     already built for the reset-password flow), terms-acceptance checkbox.
     **Open question to confirm with backend**: does this form always collect
     company name/details, with the backend silently ignoring them for a
     joining (non-first) user? That's the simplest FE build — no pre-check
     network call needed — confirm this is what Task 4 of the backend list
     assumes before building the form.
   - Step 2 — OTP email verification. Build against the new signup-OTP
     endpoints from the backend task list (distinct from the existing
     `first-login/verify-otp` endpoint this repo already calls for a different
     flow — don't reuse that hook for signup).
   - Step 3 — account created / redirect straight into the dashboard (or to
     `LoginPage`) — no review-and-pay screen, since Recovery has no
     subscription step.
2. **`registerUser`-equivalent state.** Add a slice (or extend `authSlice.ts`)
   to track signup step + in-progress form values across the flow, mirroring
   `trade-harmonizer`'s `src/app/redux/slices/userRegisterSlice.ts` structure
   but without any Stripe/plan state.
3. **RTK Query endpoints** for register + signup-OTP request/verify in
   `recoveryApi.ts`, following this repo's own `rtk-query-endpoint-gen` skill
   conventions (typed request/response, cache tags) — do not hand-roll fetch
   calls outside the existing `recoveryApi` builder pattern.
4. **Routing.** Add the signup route(s) to `src/app/router.tsx` under
   `GuestRoute` (unauthenticated-only, same guard class as `LoginPage`) —
   follow the `rp-rbac-check` skill so the route isn't accidentally left
   unguarded or unreachable. Confirm `TenantValidationGuard` still runs ahead
   of signup so an invalid/disabled subdomain shows `InvalidSubdomainPage`
   before anyone can sign up on it.
5. **"Already have an account? Log in" / "New here? Sign up" links** — check
   `LoginPage.tsx` for whether it currently has anywhere to send a new visitor
   (it likely doesn't, since signup never existed); add the cross-link both
   directions.
6. **Role-awareness, net new.** Add `role` (and `company`) to the decoded-JWT
   state in `authSlice.ts` at login, matching `trade-harmonizer`'s
   `state.personalInfo.role` pattern (`docs/architecture/authentication.md`
   in that repo). This is a prerequisite for Task 7.
7. **"Manage Users" page for Company Owners**, mirroring `trade-harmonizer`'s
   `/manage-user` — net new page (e.g. under `(dashboard)/settings` or its own
   `(dashboard)/manage-users` route) where an owner can invite/add teammates,
   wired to the backend's new recovery company-users endpoints (backend task
   list, Task 8). Gate the sidebar entry in
   `src/components/layout/app-sidebar.tsx` and the page itself to
   `company_owner` only — this repo's sidebar has no role-filtering today, so
   this is new plumbing, not a copy-paste of an existing filter.
8. **Tests.** Unit tests for the new hooks/components, following the pattern
   already used for `useForgotPasswordForm.test.tsx`/`useResetPasswordForm.test.tsx`.

## Integration tasks

- Wire the new RTK Query endpoints to the backend's finalized register/OTP
  routes and response shapes (from `trade-harmonizer-be/RECOVERY-SIGNUP-TASKS.md`)
  once they're live — don't build against guessed contracts.
- Confirm the JWT issued at signup/login decodes with the `role`/`company`
  claims the backend adds, and that `ProtectedRoute`/`DashboardLayout` pick
  them up correctly for a brand-new Company User (not just the Owner path,
  which is easier to accidentally be the only one tested).
- Confirm session persistence for a freshly-signed-up user follows the same
  `recovery_platform_auth_v2` envelope as an existing login
  (`docs/adr/0001-auth-session-strategy.md`) — no parallel storage mechanism.

## Verification tasks

- Manual E2E: three signups on the same domain (owner + two company users) —
  confirm each logs in independently with their own password, the owner sees
  the "Manage Users" entry and the two company users don't, and all three see
  the same company-scoped shipments/documents (depends on the backend's
  per-company read-scoping decision — verify against whatever that lands as,
  not against an assumption made here).
- Manual E2E: a public-email-provider signup (e.g. `@gmail.com`) does **not**
  get grouped with another public-provider signup — each becomes its own
  company, same as today's backend exemption.
- Confirm `InvalidSubdomainPage` still blocks signup on a disabled/removed
  white-label tenant.
- `npm run lint`, `npm run typecheck`, `npm test` clean; re-run
  `docs/SECURITY-STANDARDS.md §1` checks (token storage, no `localStorage`
  mirroring, deep-link handling) against the new signup screens specifically,
  since they're the newest surface touching auth state.
