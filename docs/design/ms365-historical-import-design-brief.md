# Design Brief: Microsoft 365 Historical Email Import

**For:** Design
**Feature:** Repeatable historical Microsoft 365 mailbox import into Harmony Recovery
**Status:** Ready for design exploration
**Related:** SOW "Harmony Recovery — Microsoft 365 Historical Email Import"

---

## 1. What we're building, in plain language

Right now, Harmony Recovery only learns about emails the moment they arrive in a monitored inbox. This feature lets a user go **back in time**: connect their Microsoft 365 mailbox, pick a folder, pick up to a 3-month window, and pull historical emails into Recovery as if they'd arrived today — same shipment matching, same Inbox, same everything downstream. They can run it again and again for earlier 3-month chunks until they've covered up to 3 years back.

Think of it less like "email sync" and more like **"a backfill button with a progress bar."** It's not a new inbox experience — it's a way to feed the _existing_ Inbox with older mail.

**What this is not:**

- Not a mailbox browser. The user never reads/searches their raw mailbox inside Recovery.
- Not live sync. It doesn't keep watching the mailbox after the import finishes — no ongoing notifications, no "new email" badges.
- Not a chat-like or file-explorer-like experience. It's a short, bounded, task-style flow: configure → run → see results → optionally repeat.

---

## 2. Who uses this

- **Primary user:** an authorised Recovery user (the same person who already lives in the Inbox/Shipments pages day to day) who wants to backfill history — e.g. onboarding a tenant whose past 2 years of shipment emails were never in Recovery.
- **Secondary user:** an admin, who needs a read-only view of _which imports ran, when, by whom, and whether they succeeded_ — for support and audit purposes, not for browsing mail.

---

## 3. Where this lives in the existing app

Match the current app's shape rather than inventing new patterns. Today the dashboard has:

- **Inbox** — list of ingested emails/documents, split into processed vs. unprocessed shipments (`Inbox` in the left nav)
- **Shipments** — the resulting shipment records
- **Settings** — Profile, Preferences, Security, Delete account (tabbed page)

New surfaces needed:

| Surface                       | Where it fits                                                                                             | Why                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Connect Microsoft 365**     | New tab in **Settings**                                                                                   | It's a one-time account-level connection, same weight as Security tab                                      |
| **Start Import**              | New entry point — could be a button from Settings' connection tab, or its own top-level "Import" nav item | This is the actual configure-and-run action                                                                |
| **Import Progress / History** | A view showing current + past import jobs, with drill-in to failures                                      | Lives near Import; not merged into Inbox — an import job is a _batch_, Inbox items are _individual emails_ |
| **Admin: Import Jobs**        | Read-only, admin-only list across all users' import jobs                                                  | Support/audit tool, explicitly not a mailbox browser                                                       |

Reuse the app's existing visual language: tenant-branded colors/logo (this app is white-labeled per tenant — don't hardcode brand colors in mockups, use neutral placeholders that map to CSS variables), the existing table style used in Inbox/Shipments (sortable columns, row action menus, filter dropdowns, pagination), and the existing toast pattern for success/error feedback.

**Terminology note:** the platform has a canonical glossary (`rp-domain-glossary`) — use **"tenant"** (never "client"/"customer"/"organisation") for the white-labeled org, and **"Inbox Document"** as the canonical term for a single ingested item once it lands in Recovery, to keep copy consistent with existing screens. An imported email becomes an Inbox Document the same way a live-arriving email does today.

---

## 4. The core flow to design

```
Settings → Integrations/Import tab
   │
   ├─ Not connected → [Connect Microsoft 365] button
   │        → Microsoft's own OAuth consent screen (external, not ours)
   │        → back to app: "Connected as user@client.com" + [Disconnect]
   │
   └─ Connected → [Start an import]
            │
            ▼
      Step 1: Choose source
        - Mailbox (auto-filled from the connected account)
        - Folder picker (Inbox, or a specific subfolder — folder list comes from Graph)
            │
            ▼
      Step 2: Choose date range
        - Start date / End date
        - Hard rule: max 3 months per import — UI should make this obvious
          before submit, not just error after (e.g. auto-clamp end date,
          or show a live "X of 90 days" indicator)
        - Show, contextually: "You can run more imports later for periods
          before this one, going back up to 3 years"
            │
            ▼
      Step 3: Review & start
        - Plain-language summary: "Import emails from [folder] between
          [date] and [date]. This may take a while — you'll see progress
          here and can leave this page."
        - [Start import] confirms and kicks off background processing
            │
            ▼
      Progress view (this is the one users will stare at)
        - Status: Running / Completed / Failed / Paused-retrying
        - Live counters: Scanned, Qualifying, Submitted, Ignored, Failed
        - A failure list, expandable, with a human-readable reason per item
          (not a raw error code/stack)
        - Can navigate away and come back — job keeps running in background
            │
            ▼
      Completion state
        - Clear "Import complete" summary with final totals
        - CTA to view results in Inbox, or [Start another import] for an
          earlier period
```

### Import History (list view)

A simple table, same visual pattern as Shipments' table: source mailbox/folder, date range covered, status, totals, started/finished timestamps, started-by user. Clicking a row opens that job's progress/completion detail (same component as the live progress view, just in its terminal state).

### Admin view

Same table concept, but scoped across all users/tenants an admin can see. No access to raw email content — only the job metadata and outcome counts/failures already described above. This is the guardrail worth designing deliberately: it should visually read as a **job monitor**, not an inbox.

---

## 5. States and edge cases worth designing explicitly

These are the moments that make or break trust in a "trust me, it's working in the background" feature:

1. **Not connected** — empty state with a clear single CTA to connect.
2. **Connected, no import run yet** — empty state nudging "Start your first import."
3. **Consent/connection failure** (user declines Microsoft consent, or permission is later revoked) — needs a distinct, non-scary error state with a retry path.
4. **Date range validation** — trying to pick >3 months, or a start date beyond the 3-year limit. Prefer preventing over erroring: disable/clamp dates in the picker rather than a red banner after the fact.
5. **Overlapping import warning** — if a user picks a range that overlaps a previous import, it's _allowed_ (dedup handles it server-side), but a soft heads-up ("Some of this range may already be imported — duplicates will be skipped automatically") avoids confusion about why totals look lower than expected.
6. **Running** — the "don't worry, keep this open or leave, either is fine" reassurance matters here; this is a background job, and users shouldn't feel they have to babysit a spinner.
7. **Partial failure** — most items succeeded, some failed. This should not read as an overall failure state — distinguish "completed with some failures" from "failed."
8. **Full failure** — e.g. token expired mid-run, mailbox became inaccessible. Needs a clear next action (reconnect, retry).
9. **Retry/resume in progress** — the spec requires transient failures to retry automatically; a subtle "retrying…" indicator avoids it looking stuck.
10. **Disconnect** — confirm before disconnecting if there's a running import tied to that connection.

---

## 6. Content & tone notes

- Avoid exposing internal/technical vocabulary directly: prefer **"Scanned / Matched / Added / Skipped / Failed"** in-product over the SOW's literal "scanned, qualifying, submitted, ignored, failed" — same meaning, friendlier words. (Confirm final wording with product copy owner — flagging here only that literal spec language reads as internal/engineering-facing.)
- Every failure shown to a user should have a **plain-language reason**, not a raw exception. Design the failure list with room for a short reason string per row.
- Be explicit in copy that this is **read-only** access to their mailbox and that Recovery **never sends, deletes, or modifies** their email — this is a trust-sensitive permission grant (Microsoft's own consent screen will already say this, but reinforcing it in-app before they click through reduces drop-off/anxiety).
- Avoid implying "real-time" or "always on" anywhere in copy — every screen should reinforce this is a bounded, user-initiated batch job that stops when done.

---

## 7. Reuse checklist (don't design these from scratch)

- Table component + row action menu + filter dropdown + pagination — copy the pattern already used in Inbox/Shipments tables.
- Toast notifications (success/error) — existing pattern, don't invent a new notification style.
- Settings tab shell — new tab should match the existing tab bar/layout in Settings.
- Buttons/inputs/cards — use the existing headless UI primitives' visual style (rounded cards, existing button variants) rather than new components.
- Tenant theming — all mockups should be presented in a way that clearly still works if the accent color/logo changes per client (avoid baking a specific brand color into icons/illustrations).

---

## 8. Open questions for design to flag back (not yet decided)

- Is "Start Import" its own top-level nav item, or nested under Settings/Integrations? (Affects IA, not just visuals.)
- Do we show a folder **tree** (nested subfolders) or a flat dropdown of top-level folders? Depends on how deep mailbox folder structures typically go for the users we're targeting — worth a quick product check before designing a full tree picker.
- Should Import History live as a tab within the same page as "Start Import," or as a separate nav item? Precedent: Shipments vs. Inbox are separate nav items for a similar "list vs. action" split.
- Any illustration/empty-state art direction preferences, or default to the existing empty-state style already used elsewhere in the app (if one exists — worth checking Inbox's zero-state).

---

## 9. Acceptance criteria (design-relevant subset)

Design should make each of these visually obvious/inescapable, not just technically true:

- User always knows which mailbox/folder and date range an import covers.
- User can always see current status + totals (scanned/matched/added/skipped/failed) + clear failure reasons.
- It's visually clear an import is a **bounded, one-time run**, not a live monitor.
- Admin's view never exposes raw email content — job metadata and outcomes only.
