import { recoveryApi } from '@/app/services/recoveryApi'
import type { RecoveryInboxDocumentDetailEnvelope } from '@/types/recovery-inbox-api'

const recoveryDocumentActionsApi = recoveryApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Re-runs the same identify/extract-pair pipeline the initial email ingest uses,
     * against one or more unprocessable[] attachments. Each target's `s3Key` is the
     * value currently shown for it — the backend re-validates it before doing anything
     * and rejects with 409 if it no longer matches (another action moved/changed that
     * index since this client last fetched the document). Omit `targets` (or send an
     * empty array) to retry every unprocessable attachment on the document at once.
     */
    retryUnprocessable: builder.mutation<
      RecoveryInboxDocumentDetailEnvelope,
      { id: string; targets?: { index: number; s3Key: string }[] }
    >({
      query: ({ id, targets }) => ({
        url: `/recovery/documents/${id}/retry-unprocessable`,
        method: 'POST',
        body: targets?.length ? { targets } : {},
      }),
    }),
    /**
     * Manually pairs a CI and a C88 document from Unprocessable Files into a new shipment,
     * reusing the same extraction/pairing/shipment-creation pipeline as auto-ingest and
     * retry. `ciS3Key`/`c88S3Key` are each selection's current s3Key, re-validated
     * server-side the same way as retryUnprocessable's targets — a stale selection 409s.
     */
    createManualShipment: builder.mutation<
      RecoveryInboxDocumentDetailEnvelope,
      CreateManualShipmentArgs
    >({
      query: ({ id, ...body }) => ({
        url: `/recovery/documents/${id}/create-shipment`,
        method: 'POST',
        body,
      }),
    }),
  }),
})

type CreateManualShipmentArgs = {
  id: string
  title: string
  ciIndex: number
  ciS3Key: string
  c88Index: number
  c88S3Key: string
  /** Optional packing list. Both fields together, or neither — the API rejects a half-pick. */
  plIndex?: number
  plS3Key?: string
}

export const { useRetryUnprocessableMutation, useCreateManualShipmentMutation } =
  recoveryDocumentActionsApi
