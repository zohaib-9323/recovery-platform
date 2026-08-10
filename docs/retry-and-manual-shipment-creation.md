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

**Status as of 2026-08-10:** implemented, local/uncommitted on `develop` in
this repo (see [[feedback-no-commit-push-keep-local]] — do not commit/push
without being explicitly asked again). Create Shipment was reworked on
2026-08-10 to run in the background instead of blocking the modal open — see
"Background Create Shipment" below.

## What this feature does

Inside a document's **Unprocessable Shipments** section (`inbox-detail-panel.tsx`
→ `InboxUnprocessedShipmentsTable`), a recovery user gets two new ways to
resolve attachments the automatic pipeline couldn't extract/pair:

1. **Retry** — re-runs the same extraction pipeline against one attachment
   (per-row) or every unprocessable attachment at once (bulk "Retry All").
2. **Create Shipment** — manually pick a CI and a C88 from the unprocessable
   list, give the resulting shipment a title, and the backend extracts/pairs
   them into a real shipment. Runs in the background — see below.

Both are additive — they don't replace the existing "Convert to processable"
(dumb move, no extraction) action, which still exists as a fallback.

## Background Create Shipment

The modal used to keep itself open and disabled (`isLoading`) for the whole
`createManualShipment` mutation, only closing on success. That's gone: the
modal now does client-side validation only, calls `onSubmit({ title, ciRow,
c88Row })`, and closes **immediately** — it never awaits the mutation, so a
slow backend no longer blocks the UI.

The mutation itself now runs from `InboxDetailPanel.handleCreateShipmentSubmit`,
which stays mounted for the mutation's whole lifetime regardless of the modal:

1. On submit, `InboxDetailPanel` adds an `InboxInProcessingShipmentRow` entry
   to its `inProcessingShipments` state (client-only, keyed by a generated id,
   tagged with the owning `documentId`) and fires `createManualShipment(...)`
   without awaiting it in the render path.
2. While that entry exists, its `ciRow`/`c88Row` are filtered out of both
   `InboxUnprocessedShipmentsTable`'s rows and the Create Shipment modal's own
   dropdowns (`visibleUnprocessedShipments` in `inbox-detail-panel.tsx`) — this
   is what stops the same file being submitted into two concurrent requests.
   They're shown instead in the new **In Processing Shipments** table
   (`inbox-in-processing-shipments-table.tsx`), rendered between Processable
   and Unprocessable, only when there's at least one active entry.
3. On success: toast, `onInboxUpdated?.()` refetches the document (the backend
   has already moved the files into the new shipment, so the refetched data
   shows it under Processable Shipments), then the entry is removed.
4. On failure: error toast with `getRtkErrorMessage`, entry removed. Nothing
   changed server-side, so the filtered-out rows simply reappear under
   Unprocessable Shipments on their own — there's no explicit "move back"
   step, just the absence of the filter once the entry is gone.

`inProcessingShipments` is **not** scoped to the currently-selected email —
entries carry their own `documentId` and keep running (and get rendered again)
if the user switches to a different email and back while one is in flight.
Switching away does not cancel the request.

If you need to trace this without re-deriving it: the entry-point is
`handleCreateShipmentSubmit` in `inbox-detail-panel.tsx`; it's the only place
that calls `useCreateManualShipmentMutation` now (moved out of
`create-shipment-modal.tsx`).

## File map

| File                                                                             | Role                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/services/recoveryDocumentActionsApi.ts`                                 | New RTK Query slice (`recoveryApi.injectEndpoints`) — `useRetryUnprocessableMutation`, `useCreateManualShipmentMutation`. Split into its own file because `recoveryApi.ts` was already near the ESLint `max-lines: 500` ceiling; mirrors the existing `recoveryNotificationsApi.ts` split pattern. **If you need a third recovery-document mutation, add it here, not to `recoveryApi.ts`.** |
| `src/pages/(dashboard)/inbox/types.ts`                                           | `InboxUnprocessedShipmentRow.s3Key?: string` — the field that makes targeted retry/manual-create possible. Rows without it (documents that predate this field) can't be individually selected.                                                                                                                                                                                               |
| `src/pages/(dashboard)/inbox/inbox-mappers.ts`                                   | `mapUnprocessedRows` populates `s3Key` from the API response.                                                                                                                                                                                                                                                                                                                                |
| `src/pages/(dashboard)/inbox/components/inbox-row-action-menu.tsx`               | Generalized from a single `optionLabel/onSelect` prop to `options: InboxRowActionMenuOption[]`, so a row can offer more than one action (Retry + Convert to processable). If you add a third per-row action anywhere in Inbox, extend the `options` array at the call site — don't fork this component.                                                                                      |
| `src/pages/(dashboard)/inbox/components/inbox-unprocessed-shipments-table.tsx`   | Renders the bulk "Retry All" button (hidden when `rows.length === 0` or `onRetryAll` isn't passed) and each row's Retry option. `rowBusy = isConverting \|\| isRetrying \|\| isRetryingAll` gates both per-row actions during any in-flight action, anywhere on the table.                                                                                                                   |
| `src/pages/(dashboard)/inbox/components/create-shipment-modal.tsx`               | Modal. Filters `rows` down to `selectableRows` (only rows with `s3Key`), enforces mutual exclusion between the CI/C88 dropdowns, validates client-side, then calls `onSubmit({ title, ciRow, c88Row })` and closes immediately — it does **not** call the mutation or await anything itself (see "Background Create Shipment" above).                                                        |
| `src/pages/(dashboard)/inbox/components/inbox-in-processing-shipments-table.tsx` | New table (third one on the detail page, alongside Processable/Unprocessable). Purely a rendering component — `InboxDetailPanel` owns the `inProcessingShipments` state and passes it down as `rows`.                                                                                                                                                                                        |
| `src/pages/(dashboard)/inbox/types.ts`                                           | Also adds `InboxInProcessingShipmentRow` (client-only — this row has no backend counterpart while pending).                                                                                                                                                                                                                                                                                  |
| `src/pages/(dashboard)/inbox/components/inbox-detail-panel.tsx`                  | Wires it all together: `handleRetryUnprocessable`/`handleRetryAllUnprocessable` handlers, `handleCreateShipmentSubmit` (owns `inProcessingShipments` state and the `createManualShipment` mutation call — see above), the "Create Shipment" button next to the section heading, and `<CreateShipmentModal>` mount. Calls `onInboxUpdated?.()` after any successful action to refetch.        |
| `src/i18n/messages.ts`                                                           | `inbox.actions.retry*` (7 keys), `inbox.createShipment.*` (18 keys, `submitting` now unused since the modal has no loading state), and `inbox.inProcessing.*` + `inbox.detail.inProcessingShipments` (new). This repo's `inbox/` pages use the flat `t(key)` convention (not the `MS` constants module some `shipments/` pages use) — keep new copy here, not inline strings.                |

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
- `create-shipment-modal.test.tsx` — blank-title rejection, select-both-required
  rejection, mutual-exclusion option-disabling, s3Key-less rows filtered out of
  both dropdowns + notice shown, happy-path submit (`onSubmit` called with
  `{ title, ciRow, c88Row }`, `onClose` called synchronously — no mutation
  mock needed anymore since the modal doesn't call one), all-rows-unselectable
  state (submit disabled). The old "backend error surfaces verbatim, modal
  stays open" case no longer applies to the modal (it doesn't see the
  mutation's result at all now) and isn't covered elsewhere — see the gap
  below.
- `inbox-unprocessed-shipments-table.test.tsx` — empty state, Retry All
  button hidden without `onRetryAll`, Retry All click + in-flight label,
  per-row Retry click passes the correct row, per-row busy state doesn't
  affect other rows, bulk-retry-in-flight disables every row. Unchanged by
  the background-Create-Shipment rework (this component didn't change) —
  still passes because `InboxDetailPanel` filters rows before they ever
  reach this table, not inside it.

Both files follow this repo's existing component-test convention (see
`preferences-tab.test.tsx` for the canonical example): `render` the real
component, assert on rendered text (via the real `useI18n`/`messages.ts`, not
a mock) and on callback args.

Not covered, and not obviously worth adding without a concrete need:
`InboxRowActionMenu`'s own positioning/portal logic (unchanged) and
`inbox-detail-panel.tsx`'s wiring itself (large component, would need
substantial mocking of the whole panel).

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
- **Retry/Convert still block on their mutation** (unchanged) — only Create
  Shipment runs in the background now. If Retry/Convert ever need the same
  treatment, follow the same shape: move the mutation trigger out of
  whatever component might unmount, track pending state in `InboxDetailPanel`,
  filter affected rows out of the table they'd otherwise still appear in.
- **The backend error message from a failed background Create Shipment is
  only shown as a toast** (`getRtkErrorMessage(error)` in
  `handleCreateShipmentSubmit`'s `.catch`) — there's no persistent place to
  re-read it once the toast dismisses, since the modal that used to show it
  inline is long closed by the time the request fails. If that's not
  sufficient (e.g. a user reports "it just disappeared, why"), you likely
  need to attach the error onto the removed `inProcessingShipments` entry (or
  a small separate "recently failed" list) instead of only toasting.
- **No test coverage for the background flow itself** — `handleCreateShipmentSubmit`
  (add-to-in-processing → fire mutation → move-to-processable-or-back-to-unprocessable)
  lives in `inbox-detail-panel.tsx` and isn't covered by an automated test
  (same pre-existing gap as the rest of that file's wiring — see Testing
  above). Covered manually only. If you're extending this, consider whether
  it's finally worth the mocking cost to add a panel-level test.
- **In-flight requests aren't persisted** — `inProcessingShipments` is plain
  React state on `InboxDetailPanel`. A full page reload while a Create
  Shipment request is in flight loses the in-processing row (though the
  request itself, already sent to the backend, still completes server-side).
  On next load the files will show as either still-unprocessable (if it
  failed or hadn't finished) or already-processable (if it succeeded) — there
  is no dangling state to clean up, just no "it's still running" indicator
  across a reload.
- **`recoveryDocumentActionsApi.ts` will hit the same `max-lines` ceiling
  eventually** if more mutations get added — split again by concern (e.g.
  `recoveryDocumentActionsApi2.ts` or a more descriptively named split)
  rather than fighting Prettier formatting to squeeze lines out, per the
  precedent set fixing this in Phase 4 (see git history / the backend doc's
  "Errors and fixes" if that gets preserved somewhere, or just re-derive: the
  fix was always "split the file," never "reformat around the limit").
