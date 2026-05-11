# ADR-0001: Auth Session Strategy

- Status: Accepted
- Date: 2026-04-09
- Deciders: Recovery Platform Team

## Context

The app is a browser SPA using bearer-token authentication with refresh tokens. We need persistence across reloads while minimizing token exposure risk and avoiding breaking API contracts.

## Decision

Use a short-lived, versioned `sessionStorage` envelope for auth token persistence:

- Session key: `recovery_platform_auth_v2`
- Envelope includes `expiresAtMs`
- Maximum persistence capped to 12 hours
- Legacy `localStorage` key is migrated once and removed
- Access token refresh remains server-driven through existing refresh endpoint

## Consequences

- Positive:
  - Reduces long-lived token exposure in persistent browser storage
  - Preserves existing API contracts and login behavior
  - Enables backward-compatible migration from legacy storage
- Negative:
  - Session does not persist across browser restarts by design
- Follow-up:
  - Move to HTTP-only cookies when backend supports it
