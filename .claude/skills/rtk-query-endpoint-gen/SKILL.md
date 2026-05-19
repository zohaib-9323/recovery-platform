---
name: rtk-query-endpoint-gen
description: >
  Scaffold new RTK Query endpoints in recovery-platform's centralized recoveryApi.ts,
  following the established builder pattern with typed request/response interfaces.
  Use this skill whenever you need to add a new API endpoint, create new types for
  API request/response shapes, add cache tags, or write the corresponding hook usage.
  Triggers on: "add a new endpoint", "call a new API", "add RTK Query endpoint for X",
  "create types for the X API", "new query/mutation", any time you edit recoveryApi.ts
  or src/types/recovery-*-api.ts.
---

# rtk-query-endpoint-gen — Recovery Platform

Unlike trade-harmonizer (which uses separate injected slice files), recovery-platform
uses a **single centralized API instance**: `src/app/services/recoveryApi.ts`. All
endpoints live in one `createApi` call. This keeps the store simple and makes cache
invalidation straightforward.

---

## Where things live

| File | Purpose |
|---|---|
| `src/app/services/recoveryApi.ts` | All endpoints — the only `createApi` call |
| `src/types/auth-api.ts` | Auth endpoint types |
| `src/types/recovery-user-api.ts` | User profile, preferences, dashboard, tenant types |
| `src/types/recovery-inbox-api.ts` | Inbox document types |
| `src/types/recovery-shipments-api.ts` | Shipment list, detail, landed cost types |

---

## Step 1: Add types to the right types file

Put your types in whichever `src/types/recovery-*-api.ts` file covers the domain.
If the domain is new, create a new file following the naming convention.

```typescript
// src/types/recovery-<domain>-api.ts

export interface Recovery<Resource> {
  // core fields
  id: string
  // domain-specific fields...
}

export type Recovery<Resource>ListContent = {
  items: Recovery<Resource>[]
  total: number
  page: number
}

export type Recovery<Resource>DetailEnvelope = RecoveryApiEnvelope<Recovery<Resource>>
export type Recovery<Resource>ListEnvelope = RecoveryApiEnvelope<Recovery<Resource>ListContent>

// Request body for mutations
export type Recovery<Resource>CreateBody = {
  // POST body fields
}

export type Recovery<Resource>PatchBody = {
  // PATCH body fields (all optional)
}

// Query params
export type Recovery<Resource>ListQuery = {
  page?: number
  limit?: number
  // filter params
}
```

The standard envelope types are already defined in `recovery-user-api.ts`:
```typescript
RecoveryApiEnvelope<T>      // { status, message, content: T }
ApiMessageEnvelope<T>       // { status, message, data: T }
```

---

## Step 2: Add endpoints to recoveryApi.ts

Open `src/app/services/recoveryApi.ts`. Add your endpoints inside the `endpoints` builder:

```typescript
// Inside the endpoints: (builder) => ({ ... }) block

// ── List query ───────────────────────────────────────────────────────────────
getRecovery<Resource>List: builder.query<
  Recovery<Resource>ListEnvelope,
  Recovery<Resource>ListQuery
>({
  query: (params) => ({
    url: '/recovery/<resource>',
    method: 'GET',
    params,
  }),
  providesTags: (result) =>
    result?.content?.items
      ? [
          ...result.content.items.map(({ id }) => ({
            type: 'Recovery<Resource>' as const,
            id,
          })),
          { type: 'Recovery<Resource>' as const, id: 'LIST' },
        ]
      : [{ type: 'Recovery<Resource>' as const, id: 'LIST' }],
}),

// ── Detail query ─────────────────────────────────────────────────────────────
getRecovery<Resource>Detail: builder.query<
  Recovery<Resource>DetailEnvelope,
  { id: string }
>({
  query: ({ id }) => ({
    url: `/recovery/<resource>/${id}`,
    method: 'GET',
  }),
  providesTags: (_result, _error, { id }) => [
    { type: 'Recovery<Resource>', id },
  ],
}),

// ── Create mutation ──────────────────────────────────────────────────────────
createRecovery<Resource>: builder.mutation<
  Recovery<Resource>DetailEnvelope,
  Recovery<Resource>CreateBody
>({
  query: (body) => ({
    url: '/recovery/<resource>',
    method: 'POST',
    body,
  }),
  invalidatesTags: [{ type: 'Recovery<Resource>', id: 'LIST' }],
}),

// ── Patch mutation ───────────────────────────────────────────────────────────
patchRecovery<Resource>: builder.mutation<
  Recovery<Resource>DetailEnvelope,
  { id: string } & Recovery<Resource>PatchBody
>({
  query: ({ id, ...body }) => ({
    url: `/recovery/<resource>/${id}`,
    method: 'PATCH',
    body,
  }),
  invalidatesTags: (_result, _error, { id }) => [
    { type: 'Recovery<Resource>', id },
    { type: 'Recovery<Resource>', id: 'LIST' },
  ],
}),
```

---

## Step 3: Register the new tag type

At the top of `createApi`, add your new tag to `tagTypes`:

```typescript
export const recoveryApi = createApi({
  tagTypes: [
    'RecoveryProfile',
    'RecoveryPreferences',
    'RecoveryShipments',
    'RecoveryShipment',
    'Recovery<Resource>',   // ← add here
  ],
  // ...
})
```

---

## Step 4: Export the hooks

RTK Query auto-generates hooks. Export them at the bottom of `recoveryApi.ts`:

```typescript
export const {
  // existing hooks...
  useGetRecovery<Resource>ListQuery,
  useGetRecovery<Resource>DetailQuery,
  useCreateRecovery<Resource>Mutation,
  usePatchRecovery<Resource>Mutation,
} = recoveryApi
```

---

## Using hooks in components

```typescript
import {
  useGetRecoveryShipmentDetailQuery,
  usePatchRecoveryProfileMutation,
} from '@/app/services/recoveryApi'

function ShipmentDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError } = useGetRecoveryShipmentDetailQuery({ id })
  const [patchProfile, { isLoading: isSaving }] = usePatchRecoveryProfileMutation()

  // data?.content is the typed RecoveryShipment
}
```

---

## Checklist before committing

- [ ] Types added to correct `src/types/recovery-*-api.ts` file
- [ ] New tag type added to `tagTypes` array in `createApi`
- [ ] `providesTags` / `invalidatesTags` cover list + individual item invalidation
- [ ] Hook names exported from `recoveryApi.ts`
- [ ] `overrideExisting` is NOT needed (there's only one `createApi`)
- [ ] No second `createApi` instance created anywhere

---

## Existing endpoints for reference

| Hook | Method | URL | Tag |
|---|---|---|---|
| `useGetRecoveryProfileQuery` | GET | `/recovery/users/profile` | `RecoveryProfile:ME` |
| `usePatchRecoveryProfileMutation` | PATCH | `/recovery/users/profile` | invalidates `RecoveryProfile:ME` |
| `useGetRecoveryShipmentsListQuery` | GET | `/recovery/shipments` | `RecoveryShipments:LIST` |
| `useGetRecoveryShipmentDetailQuery` | GET | `/recovery/shipments/:id` | `RecoveryShipment:id` |
| `useGetRecoveryInboxDocumentsQuery` | GET | `/recovery/inbox` | — |
| `useLoginMutation` | POST | `/recovery/auth/login` | — |
