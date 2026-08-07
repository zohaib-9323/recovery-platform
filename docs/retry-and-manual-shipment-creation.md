# Retry & Manual Shipment Creation (Inbox → Unprocessable Files)

**Purpose of this doc:** a single reference for anyone (human or Claude) coming
back to fix a bug or extend this feature later, without having to re-derive
the design from the diff. This repo has no per-feature doc convention
(`docs/` only holds ADRs and pre-build design briefs) — this file is a
deliberate exception, kept as a flat reference doc rather than an ADR
(no decision to record) or a design brief (already built, not a proposal).

**Backend companion doc (read this too, especially for the API contract and
non-breaking guarantees):**
`trade-harmonizer-be/docs/10-business-flows/recovery-retry-manual-shipment.md`

**Status as of 2026-08-07:** implemented, local/uncommitted on `develop` in
this repo (see [[feedback-no-commit-push-keep-local]] — do not commit/push
without being explicitly asked again).

## What this feature does

Inside a document's **Unprocessable Shipments** section (`inbox-detail-panel.tsx`
→ `InboxUnprocessedShipmentsTable`), a recovery user gets two new ways to
resolve attachments the automatic pipeline couldn't extract/pair:

1. **Retry** — re-runs the same extraction pipeline against one attachment
   (per-row) or every unprocessable attachment at once (bulk "Retry All").
2. **Create Shipment** — manually pick a CI and a C88 from the unprocessable
   list, give the resulting shipment a title, and the backend extracts/pairs
   them into a real shipment.

Both are additive — they don't replace the existing "Convert to processable"
(dumb move, no extraction) action, which still exists as a fallback.

## File map

| File                                                                           | Role                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/services/recoveryDocumentActionsApi.ts`                               | New RTK Query slice (`recoveryApi.injectEndpoints`) — `useRetryUnprocessableMutation`, `useCreateManualShipmentMutation`. Split into its own file because `recoveryApi.ts` was already near the ESLint `max-lines: 500` ceiling; mirrors the existing `recoveryNotificationsApi.ts` split pattern. **If you need a third recovery-document mutation, add it here, not to `recoveryApi.ts`.** |
| `src/pages/(dashboard)/inbox/types.ts`                                         | `InboxUnprocessedShipmentRow.s3Key?: string` — the field that makes targeted retry/manual-create possible. Rows without it (documents that predate this field) can't be individually selected.                                                                                                                                                                                               |
| `src/pages/(dashboard)/inbox/inbox-mappers.ts`                                 | `mapUnprocessedRows` populates `s3Key` from the API response.                                                                                                                                                                                                                                                                                                                                |
| `src/pages/(dashboard)/inbox/components/inbox-row-action-menu.tsx`             | Generalized from a single `optionLabel/onSelect` prop to `options: InboxRowActionMenuOption[]`, so a row can offer more than one action (Retry + Convert to processable). If you add a third per-row action anywhere in Inbox, extend the `options` array at the call site — don't fork this component.                                                                                      |
| `src/pages/(dashboard)/inbox/components/inbox-unprocessed-shipments-table.tsx` | Renders the bulk "Retry All" button (hidden when `rows.length === 0` or `onRetryAll` isn't passed) and each row's Retry option. `rowBusy = isConverting \|\| isRetrying \|\| isRetryingAll` gates both per-row actions during any in-flight action, anywhere on the table.                                                                                                                   |
| `src/pages/(dashboard)/inbox/components/create-shipment-modal.tsx`             | New modal. Filters `rows` down to `selectableRows` (only rows with `s3Key`), enforces mutual exclusion between the CI/C88 dropdowns, validates client-side before calling the mutation, and on error calls `getRtkErrorMessage(error)` so the backend's exact message (including a 409 stale-selection rejection) reaches the user verbatim.                                                 |
| `src/pages/(dashboard)/inbox/components/inbox-detail-panel.tsx`                | Wires it all together: `handleRetryUnprocessable`/`handleRetryAllUnprocessable` handlers, the "Create Shipment" button next to the section heading, and `<CreateShipmentModal>` mount. Calls `onInboxUpdated?.()` after any successful action to refetch.                                                                                                                                    |
| `src/i18n/messages.ts`                                                         | `inbox.actions.retry*` (7 keys) and `inbox.createShipment.*` (18 keys). This repo's `inbox/` pages use the flat `t(key)` convention (not the `MS` constants module some `shipments/` pages use) — keep new copy here, not inline strings.                                                                                                                                                    |

## API contract this FE code depends on

Both endpoints live on `RecoveryDocumentsSelfController` in `trade-harmonizer-be`,
scoped to the caller's `recoveryUserId`:

- `POST /recovery/documents/:id/retry-unprocessable`
  Body: `{ targets?: { index: number; s3Key: string }[] }` — omit/empty `targets`
  retries everything.
- `POST /recovery/documents/:id/create-shipment`
  Body: `{ title, ciIndex, ciS3Key, c88Index, c88S3Key }`.

**The `s3Key` you send back must be the value currently shown for that row.**
`processable[]`/`unprocessable[]` are plain Mongo arrays with no stable
per-item `_id` — the backend re-validates the echoed `s3Key` against the
document's current state before doing anything, and returns **409** if it's
stale (another action shifted the array in the meantime). The FE doesn't
special-case this response — `getRtkErrorMessage` just surfaces whatever
message the backend sends, so **don't add a bespoke 409 handler here**; if the
error copy needs to change, change it on the backend DTO/exception message.

## Testing

- `inbox-mappers.test.ts` — `s3Key` carried through / undefined fallback (2 tests).
- `create-shipment-modal.test.tsx` (new, Phase 7) — blank-title rejection,
  select-both-required rejection, mutual-exclusion option-disabling,
  s3Key-less rows filtered out of both dropdowns + notice shown, happy-path
  submit (correct payload shape, toast, refetch callback, close), backend
  error message surfaced verbatim and modal stays open, all-rows-unselectable
  state (submit disabled).
- `inbox-unprocessed-shipments-table.test.tsx` (new, Phase 7) — empty state,
  Retry All button hidden without `onRetryAll`, Retry All click + in-flight
  label, per-row Retry click passes the correct row, per-row busy state
  doesn't affect other rows, bulk-retry-in-flight disables every row.

Both new test files follow this repo's existing component-test convention
(see `preferences-tab.test.tsx` for the canonical example): `jest.mock` the
RTK Query hook module, `render` the real component, assert on rendered text
(via the real `useI18n`/`messages.ts`, not a mock) and on the mutation call
args. **Correction to an earlier claim:** an earlier pass through this work
said this repo had "no component-test precedent for inbox modals/tables" —
that was wrong; the precedent exists (`preferences-tab.test.tsx`,
`edit-profile-tab.test.tsx`), it just hadn't been applied to `inbox/` yet.
These two new files are that application.

Not covered, and not obviously worth adding without a concrete need:
`InboxRowActionMenu`'s own positioning/portal logic (unchanged in this
feature, only its prop shape changed) and `inbox-detail-panel.tsx`'s wiring
itself (large component, would need substantial mocking of the whole panel;
the handlers it calls are covered indirectly through the table/modal tests
above plus the pre-existing mapper tests).

## Known gaps / things to check before extending this

- **Rows without `s3Key`** (documents ingested before this field existed)
  can't be retried individually or selected in Create Shipment — bulk
  "Retry All" is the only option for them, since it doesn't echo a client
  snapshot back. If a bug report says "Retry doesn't show up for an old
  email," check whether the row actually has `s3Key` first.
- **Manual pairing is CI + C88 only** — no third-document/Packing-List slot.
  If that ever needs to change, it's a coordinated FE+BE change (new DTO
  field, new dropdown, new validation) — see the locked-scope note in the
  backend doc before assuming it's FE-only.
- **`InboxRowActionMenu`'s trigger `disabled` prop disables the whole menu**,
  not individual options independently of `rowBusy` — if a future action
  needs its own independent enable/disable state unrelated to Retry/Convert,
  use each option's own `disabled` field (already supported) rather than the
  menu-level prop.
- **No optimistic UI** — every action waits for the mutation to resolve, then
  calls `onInboxUpdated?.()` to refetch. If this ever feels slow, that's the
  place to add optimistic updates, not a new loading-state pattern.
- **`recoveryDocumentActionsApi.ts` will hit the same `max-lines` ceiling
  eventually** if more mutations get added — split again by concern (e.g.
  `recoveryDocumentActionsApi2.ts` or a more descriptively named split)
  rather than fighting Prettier formatting to squeeze lines out, per the
  precedent set fixing this in Phase 4 (see git history / the backend doc's
  "Errors and fixes" if that gets preserved somewhere, or just re-derive: the
  fix was always "split the file," never "reformat around the limit").
