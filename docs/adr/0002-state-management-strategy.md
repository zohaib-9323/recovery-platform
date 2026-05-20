# ADR-0002: State Management Strategy

- Status: Accepted
- Date: 2026-04-09
- Deciders: Recovery Platform Team

## Context

The app handles UI state, auth/session state, and remote API state. We need predictable flows with testable behavior and minimal global state.

## Decision

- Use Redux Toolkit slices only for cross-cutting client state:
  - `auth`
  - `sideBar`
- Use RTK Query for server-state fetching/mutations and caching
- Keep form/interaction state in local component hooks
- Persist only auth tokens; avoid globalizing page-local state

## Consequences

- Positive:
  - Predictable data flow and cache invalidation
  - Reduced global state surface area
  - Better separation between UI state and API state
- Negative:
  - Requires discipline to avoid bypassing RTK Query
- Follow-up:
  - Add architecture lint constraints for store usage boundaries
