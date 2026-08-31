# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start            # Start dev server (CRACO)
npm run build        # Production build

# Code quality
npm run lint         # ESLint 9 flat config
npm run format       # Prettier (--write)
npm run typecheck    # tsc --noEmit

# Testing
npm test             # Interactive watch mode
npm run test:ci      # Single run with coverage (required in CI)

# Dependency checks
npx madge --circular src/  # Detect circular imports (runs in CI)
npm run security          # Trivy + npm audit
```

### Custom Claude Command

- `/strict-ai-code-review <scope>`: Runs a strict tabular production review using the enforced checklist and summary format.

Coverage thresholds (enforced in CI): 70% lines/statements/functions, 65% branches. Critical paths have higher targets: `api.ts` 90%, `authSession.ts` 85%.

## Environment

Copy `.env.example` to `.env.local`. `REACT_APP_API_BASE_URL` is required — the app will throw at startup if missing.

## Architecture

**Entry:** `src/index.tsx` → `<Providers>` (Redux store, session sync, theme bootstrap, toast) → `<AppErrorBoundary>` → `<AppRouter>`

### Routing (`src/app/router.tsx`)

Three guard layers are composed in sequence:

1. `TenantValidationGuard` — validates subdomain against the API; redirects to `/invalid-subdomain` if not found
2. `GuestRoute` / `ProtectedRoute` — auth-gated splits
3. `AuthLayout` / `DashboardLayout` — shell components

Routes under `(dashboard)/` in `src/pages/` are protected. Auth flows live in `src/pages/auth/`.

### State (`src/app/store.ts`, `src/app/features/`)

Redux Toolkit with three hand-managed slices (`auth`, `tenantTheme`, `sideBar`) plus the RTK Query cache (`recoveryApi`). A listener middleware handles:

- **401 responses** → automatic token refresh → retry original request
- **Logout action** → RTK Query cache reset

Auth tokens are persisted to `localStorage` via a store subscription (`src/services/authStorage.ts`) and hydrated at startup via `src/app/authPreload.ts`.

### API Layer (`src/app/services/recoveryApi.ts`)

All network calls go through a single RTK Query API instance. The base query injects the `Authorization` header and triggers the refresh+retry flow on 401 before failing. Endpoint families:

- **auth** — login, OTP, password setup/reset, token refresh
- **user** — profile, preferences, dashboard stats, delete-request
- **shipments** — paginated list, detail, landed-cost
- **inbox** — document list/detail

Direct HTTP utilities in `src/services/api.ts` are used only for the session refresh call (outside RTK Query to avoid circular reauth loops).

### UI Conventions

- Headless primitives in `src/components/ui/` (button, input, label, card, tooltip, field-input) built with `class-variance-authority` + `tailwind-merge`.
- Domain components live in `src/components/dashboard/` or co-located inside `src/pages/`.
- Page files over 500 lines will fail the ESLint `max-lines` rule.
- `no-console` is an error — use the error reporting utilities in `src/lib/error-reporting.ts`.
- Use `===` everywhere (`eqeqeq: always`). Always use braces on control flow (`curly: all`).

### Path Aliases

`@/`_ resolves to `src/_` in both TypeScript and webpack (via CRACO).

### Multi-Tenant Theming

Tenant config (colors, logo) is fetched once on load and stored in the `tenantTheme` Redux slice. `src/app/TenantThemeBootstrap.tsx` applies CSS variables; `src/lib/tenantTheme.ts` contains the mapping logic.

## Feature reference docs

`docs/` mostly holds ADRs (`docs/adr/`, decisions) and pre-build design briefs (`docs/design/`). A small number of already-shipped features that are easy to get wrong on a follow-up change get a flat reference doc directly under `docs/` instead — check there before re-deriving a feature's design from the diff:

- [`docs/retry-and-manual-shipment-creation.md`](./docs/retry-and-manual-shipment-creation.md) — Inbox → Unprocessable Files "Retry" and "Create Shipment" actions (file map, API contract incl. the `s3Key` stale-selection guard, test coverage, known gaps). Companion backend doc: `trade-harmonizer-be/docs/10-business-flows/recovery-retry-manual-shipment.md`. Its last section covers how the **Import Jobs** detail screen reuses the same flow with a single _unified_ processable/unprocessable list (one recovery document per import job, not per email) and a deliberately narrower action set.
