---
name: rp-domain-glossary
description: >
  Canonical domain terminology for the Recovery Platform. Use this skill whenever you are
  creating new types, naming API endpoints, writing UI copy, editing src/types/ files, or
  adding new features. Prevents naming drift between the API contracts, TypeScript types,
  and UI. Triggers on: "what is X called", "name for X entity", "typing the X response",
  editing any file in src/types/, adding a new page or component that introduces new domain
  concepts, or writing UI label text.
---

# rp-domain-glossary — Recovery Platform

Use the terms below as the canonical vocabulary in code and UI copy. The primary
sources of truth are `src/types/recovery-*-api.ts` and the API contract.

---

## Core domain concepts

### Recovery Platform

The product name. The app runs at a tenant-specific subdomain. Do not abbreviate to "RP"
in UI copy; use "Recovery Platform" or just "the platform" contextually.

- Code prefix: `Recovery` (all domain types are prefixed with `Recovery`)

### Tenant

A company or organisation that has a white-label instance of the Recovery Platform on
their own subdomain. Tenant context is resolved at startup via `TenantValidationGuard`.

- Code: `ValidateTenantQuery`, `ValidateTenantContent`
- API: `GET /recovery/tenants/validate?subdomain=<subdomain>`
- Redux: available via the tenant feature in `src/app/features/tenant/`
- **Not** "client", "customer", or "organisation" in code

### Tenant Theme

Per-tenant visual branding (colours, logo). Loaded from the API during tenant validation.

- Code: `RecoveryTenantTheme`
- File: `src/types/recovery-user-api.ts`
- Applied by: `src/app/TenantThemeBootstrap.tsx`

---

## User & auth entities

### User

The authenticated end-user of the platform (a recovery claimant or agent).

- Code: `User` (from `src/types/`)
- Auth state: `state.auth.user` — derived from the JWT access token
- **Not** "account" or "member"

### Auth Tokens

- Access token: short-lived JWT. Stored in `state.auth.token`.
- Refresh token: long-lived. Stored in `state.auth.refreshToken`.
- First login: new users go through OTP verification + password setup before normal login

### First Login Flow

The onboarding sequence for newly provisioned users:

1. `/first-login/verify-otp` — enter email OTP
2. `/first-login/setup-password` — set permanent password
3. Redirect to `/login`

- Code: `FirstLoginVerifyOtpBody`, `FirstLoginVerifyOtpContent`, `FirstLoginSetupPasswordBody`, `FirstLoginRequestOtpBody`

### Profile

The user's personal information (name, email, avatar, etc.).

- Code: `RecoveryUserProfile`, `RecoveryProfilePatchBody`
- API: `GET/PATCH /recovery/users/profile`
- Redux tag: `RecoveryProfile:ME`
- **Not** "account settings" in API terms; that's a separate `Preferences` concept

### Preferences

User-configurable settings (notifications, display options, etc.).

- Code: `RecoveryPreferences`, `RecoveryPreferencesBody`
- API: `GET /recovery/users/preferences`, `POST /recovery/users/preferences`
- Redux tag: `RecoveryPreferences:ME`
- **Not** "settings" in type names

### Delete Request

A user's request to permanently delete their account and data.

- Code: `RecoveryDeleteRequestBody`, `RecoveryDeleteRequestStatus`
- **Not** "account closure" or "cancellation"

---

## Shipment entities

### Shipment

A logistics record representing a cross-border trade movement (similar to trade-harmonizer).

- Code: `RecoveryShipment` (prefix distinguishes from TH types)
- List: `RecoveryShipmentsListEnvelope`, `RecoveryShipmentsListQuery`
- Detail: `RecoveryShipmentDetailEnvelope`
- API: `GET /recovery/shipments`, `GET /recovery/shipments/:id`
- Redux tags: `RecoveryShipments:LIST`, `RecoveryShipment:<id>`
- **Not** "order", "consignment", or "delivery"

### Landed Cost

The total cost to import a shipment including duties, taxes, and fees.

- Code: `RecoveryShipmentLandedCostEnvelope`
- API: part of the shipment detail endpoints
- **Not** "total cost" or "import cost"

---

## Inbox entities

### Inbox

The document inbox where incoming trade documents (invoices, customs forms, etc.) arrive.

- Code prefix: `RecoveryInbox`
- Route: `/inbox`
- Page: `InboxPage`

### Inbox Document

An individual document in the inbox.

- Code: `RecoveryInboxDocumentDetailEnvelope`, `RecoveryInboxDocumentsListEnvelope`
- Types: `RecoveryDocumentRecordType` — enum of document categories
- **Not** "file", "attachment", or "record" in type names

---

## API envelope types

All API responses are wrapped in one of these envelopes:

```typescript
// Standard list/detail response
RecoveryApiEnvelope<T> = {
  status: boolean
  message: string
  content: T
}

// Message-only responses (e.g. delete, reset-password)
ApiMessageEnvelope<T> = {
  status: boolean
  message: string
  data: T
}

// Auth response (has content with tokens)
RecoveryAuthEnvelope = RecoveryApiEnvelope<{
  access_token: string
  refresh_token: string
}>
```

Always unwrap via `data.content` (not `data.data` or `data.result`) when consuming RTK Query responses.

---

## Dashboard

The home/overview page after login.

- Code: `RecoveryDashboardContent`
- Route: `/dashboard`
- Page: `DashboardHomePage`
- API: `GET /recovery/users/dashboard`
- **Not** "home page" or "overview" in type names

---

## Naming conventions

| What            | Convention                                  | Example                                   |
| --------------- | ------------------------------------------- | ----------------------------------------- |
| Domain types    | `Recovery` prefix + PascalCase              | `RecoveryShipment`, `RecoveryUserProfile` |
| Envelope types  | `Recovery<Domain>Envelope`                  | `RecoveryShipmentDetailEnvelope`          |
| Query params    | `Recovery<Domain>Query`                     | `RecoveryShipmentsListQuery`              |
| Request bodies  | `Recovery<Domain>Body`                      | `RecoveryProfilePatchBody`                |
| Auth types      | No `Recovery` prefix (shared)               | `LoginRequestBody`, `ResetPasswordBody`   |
| RTK hooks       | `use<Verb>Recovery<Resource>Query/Mutation` | `useGetRecoveryProfileQuery`              |
| Type files      | `src/types/recovery-<domain>-api.ts`        | `recovery-shipments-api.ts`               |
| Page components | `<Domain>Page`                              | `AllShipmentsPage`, `DashboardHomePage`   |
| Page files      | `src/pages/(dashboard)/<domain>/`           | `src/pages/(dashboard)/shipments/`        |
