import { recoveryApi } from '@/app/services/recoveryApi'
import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'
import type {
  M365StatusEnvelope,
  M365AuthUrlEnvelope,
  M365FoldersEnvelope,
  M365ImportJobEnvelope,
  M365ImportJobBody,
  M365ImportJobsListEnvelope,
  M365ImportJobsListQuery,
  M365ImportJobDetailEnvelope,
  M365ImportJobItemsEnvelope,
  M365ImportJobItemsQuery,
  M365ImportJobShipmentsEnvelope,
  M365UnprocessedDocumentsEnvelope,
  M365UnprocessedDocumentsQuery,
  M365CreateCrossImportShipmentBody,
  M365CreateCrossImportShipmentEnvelope,
  M365ProcessableShipmentsEnvelope,
  M365ProcessableShipmentsQuery,
} from '@/types/recovery-m365-api'

const recoveryM365Api = recoveryApi.injectEndpoints({
  endpoints: (builder) => ({
    getM365Status: builder.query<M365StatusEnvelope, void>({
      query: () => ({ url: '/recovery/m365/status', method: 'GET' }),
      providesTags: [{ type: 'M365Connection', id: 'STATUS' }],
    }),
    getM365AuthUrl: builder.mutation<M365AuthUrlEnvelope, void>({
      query: () => ({ url: '/recovery/m365/auth-url', method: 'GET' }),
    }),
    disconnectM365: builder.mutation<RecoveryApiEnvelope<null>, void>({
      query: () => ({ url: '/recovery/m365/disconnect', method: 'DELETE' }),
      invalidatesTags: [{ type: 'M365Connection', id: 'STATUS' }],
    }),
    getM365Folders: builder.query<M365FoldersEnvelope, void>({
      query: () => ({ url: '/recovery/m365/folders', method: 'GET' }),
      providesTags: [{ type: 'M365Connection', id: 'FOLDERS' }],
    }),
    startM365ImportJob: builder.mutation<M365ImportJobEnvelope, M365ImportJobBody>({
      query: (body) => ({ url: '/recovery/m365/import-jobs', method: 'POST', body }),
      invalidatesTags: [{ type: 'M365ImportJobs', id: 'LIST' }],
    }),
    getM365ImportJobs: builder.query<M365ImportJobsListEnvelope, M365ImportJobsListQuery | void>({
      query: (params) => ({
        url: '/recovery/m365/import-jobs',
        method: 'GET',
        params: { page: params?.page ?? 1, limit: params?.limit ?? 20 },
      }),
      providesTags: [{ type: 'M365ImportJobs', id: 'LIST' }],
    }),
    getM365ImportJobDetail: builder.query<M365ImportJobDetailEnvelope, string>({
      query: (id) => ({ url: `/recovery/m365/import-jobs/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'M365ImportJobDetail', id }],
    }),
    getM365ImportJobItems: builder.query<M365ImportJobItemsEnvelope, M365ImportJobItemsQuery>({
      query: ({ id, page = 1, limit = 50 }) => ({
        url: `/recovery/m365/import-jobs/${id}/items`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'M365ImportJobItems', id }],
    }),
    /**
     * The job's processable / unprocessable shipment lists, unified across every
     * email in the import — unlike the Inbox, where each email carries its own.
     *
     * Returns the same recovery-document payload the Inbox detail endpoint does
     * (the backend stores one document per import job), so its `_id` is what the
     * existing `createManualShipment` and `getRecoveryDownloadUrl` endpoints act
     * on. `content` is null until the job finishes pairing.
     */
    getM365ImportJobShipments: builder.query<M365ImportJobShipmentsEnvelope, string>({
      query: (id) => ({ url: `/recovery/m365/import-jobs/${id}/shipments`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'M365ImportJobShipments', id }],
    }),
    /**
     * Every unprocessable file across ALL of this user's import jobs, as one flat
     * paginated list — the cross-import counterpart of
     * `getM365ImportJobShipments`, which is scoped to a single job.
     *
     * Rows are `unprocessable[]` ELEMENTS, not documents: each carries the
     * `documentId` + `index` + `s3Key` triple that identifies it, which is what
     * `createCrossImportShipment` takes. `content.importJobs` ignores the active
     * filters on purpose, so the filter control can always be widened again.
     */
    getM365UnprocessedDocuments: builder.query<
      M365UnprocessedDocumentsEnvelope,
      M365UnprocessedDocumentsQuery | void
    >({
      query: (params) => ({
        url: '/recovery/m365/unprocessed-documents',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 25,
          ...(params?.importJobId ? { importJobId: params.importJobId } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.type ? { type: params.type } : {}),
        },
      }),
      providesTags: [{ type: 'M365UnprocessedDocuments', id: 'LIST' }],
    }),
    /**
     * Every paired C88 + CI across all import jobs — the processable counterpart
     * of `getM365UnprocessedDocuments`.
     *
     * Pairs the user created by hand on the Unprocessed Documents screen show up
     * here with no special handling, which is why `createCrossImportShipment`
     * invalidates this tag: the manual pair is stored on an import-job document
     * like any automatic one.
     */
    getM365ProcessableShipments: builder.query<
      M365ProcessableShipmentsEnvelope,
      M365ProcessableShipmentsQuery | void
    >({
      query: (params) => ({
        url: '/recovery/m365/processable-shipments',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          ...(params?.importJobId ? { importJobId: params.importJobId } : {}),
          ...(params?.search ? { search: params.search } : {}),
        },
      }),
      providesTags: [{ type: 'M365ProcessableShipments', id: 'LIST' }],
    }),
    /**
     * Manually pairs one CI and one C88 into a shipment. The two may come from
     * DIFFERENT import jobs — that is the whole point of the cross-import
     * screen — so each side carries its own `documentId`, unlike
     * `createManualShipment`, which pairs within one document.
     *
     * Both files leave their unprocessable lists, so this invalidates the list
     * as well as the owning jobs' per-job shipment views.
     */
    createCrossImportShipment: builder.mutation<
      M365CreateCrossImportShipmentEnvelope,
      M365CreateCrossImportShipmentBody
    >({
      query: (body) => ({
        url: '/recovery/m365/unprocessed-documents/create-shipment',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'M365UnprocessedDocuments', id: 'LIST' },
        // The pair now exists — it belongs to the processable list.
        { type: 'M365ProcessableShipments', id: 'LIST' },
        // ...and a real shipment was created, so All Shipments is stale too.
        { type: 'RecoveryShipments', id: 'LIST' },
        // The pair also disappeared from (and a shipment appeared in) whichever
        // job detail screens those two files belonged to.
        'M365ImportJobShipments',
      ],
    }),
    /**
     * Downloads an attachment and returns it as a Blob.
     * The backend proxies bytes from Graph API (or redirects to a presigned S3 URL
     * which fetch follows automatically). Use the returned Blob to create an
     * object URL and trigger a browser download.
     */
    downloadM365ImportItem: builder.mutation<Blob, { jobId: string; itemId: string }>({
      query: ({ jobId, itemId }) => ({
        url: `/recovery/m365/import-jobs/${jobId}/items/${itemId}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

export const {
  useGetM365StatusQuery,
  useGetM365AuthUrlMutation,
  useDisconnectM365Mutation,
  useGetM365FoldersQuery,
  useStartM365ImportJobMutation,
  useGetM365ImportJobsQuery,
  useGetM365ImportJobDetailQuery,
  useGetM365ImportJobItemsQuery,
  useGetM365ImportJobShipmentsQuery,
  useGetM365UnprocessedDocumentsQuery,
  useGetM365ProcessableShipmentsQuery,
  useCreateCrossImportShipmentMutation,
  useDownloadM365ImportItemMutation,
} = recoveryM365Api
