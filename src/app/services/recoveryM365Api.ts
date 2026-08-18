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
  useDownloadM365ImportItemMutation,
} = recoveryM365Api
