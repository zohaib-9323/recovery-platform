import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { applyTokens, logout, type AuthState } from '@/app/features/auth/authSlice'
import { reportRuntimeError } from '@/lib/error-reporting'
import { refreshSession } from '@/services/authSession'
import { isAuthUrl } from '@/app/services/auth-urls'
import { runBaseQueryWithReauth } from '@/app/services/reauth'
import type {
  ApiMessageEnvelope,
  FirstLoginRequestOtpBody,
  FirstLoginSetupPasswordBody,
  FirstLoginVerifyOtpBody,
  FirstLoginVerifyOtpContent,
  LoginRequestBody,
  RecoveryAuthEnvelope,
  RequestPasswordResetBody,
  ResetPasswordBody,
} from '@/types/auth-api'
import type {
  RecoveryApiEnvelope,
  RecoveryDashboardContent,
  RecoveryChangePasswordBody,
  RecoveryDeleteRequestBody,
  RecoveryDeleteRequestStatus,
  RecoveryPreferences,
  RecoveryPreferencesBody,
  RecoveryProfilePatchBody,
  RecoveryTenantTheme,
  RecoveryUserProfile,
  ValidateTenantQuery,
  ValidateTenantContent,
} from '@/types/recovery-user-api'
import type {
  RecoveryInboxDocumentDetailEnvelope,
  RecoveryInboxDocumentsListEnvelope,
  RecoveryDocumentRecordType,
} from '@/types/recovery-inbox-api'
import type {
  RecoveryPreferentialDutyEnvelope,
  RecoveryShipmentDetailEnvelope,
  RecoveryShipmentDownloadEnvelope,
  RecoveryShipmentDownloadFileType,
  RecoveryShipmentDownloadRequest,
  RecoveryShipmentLandedCostEnvelope,
  RecoveryShipmentLogsEnvelope,
  RecoveryShipmentLogsQuery,
  RecoveryShipmentsListEnvelope,
  RecoveryShipmentsListQuery,
} from '@/types/recovery-shipments-api'
import { env } from '@/utils/env'

type StateWithAuth = { auth: AuthState }

const baseUrl = env.apiBaseUrl.replace(/\/$/, '')

function isFetchBaseQueryErrorLike(error: unknown): error is FetchBaseQueryError {
  return Boolean(error && typeof error === 'object' && 'status' in error)
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState, arg }) => {
    const a = typeof arg === 'string' ? { url: arg } : arg
    const url = typeof a.url === 'string' ? a.url : ''
    if (!isAuthUrl(url)) {
      const token = (getState() as StateWithAuth).auth.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  return runBaseQueryWithReauth<FetchBaseQueryError>(
    args as unknown as Record<string, unknown> | string,
    {
      dispatch: api.dispatch,
      getState: () => api.getState() as StateWithAuth,
    },
    extraOptions,
    (a, c, e) =>
      rawBaseQuery(a as string | FetchArgs, c as Parameters<typeof rawBaseQuery>[1], e as object),
    (dispatch, getState) =>
      refreshSession(
        dispatch as Parameters<typeof refreshSession>[0],
        () => getState() as StateWithAuth,
      ),
    logout,
  ) as ReturnType<BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>>
}

export const recoveryApi = createApi({
  reducerPath: 'recoveryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'RecoveryProfile',
    'RecoveryPreferences',
    'RecoveryShipments',
    'RecoveryShipment',
    'RecoveryNotifications',
  ],
  endpoints: (builder) => ({
    login: builder.mutation<RecoveryAuthEnvelope, LoginRequestBody>({
      query: (body) => ({
        url: '/recovery/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const c = data.content
          if (c?.access_token && c?.refresh_token) {
            dispatch(
              applyTokens({
                accessToken: c.access_token,
                refreshToken: c.refresh_token,
              }),
            )
          }
        } catch (error) {
          // Invalid credentials and other API rejections are handled by the caller UI.
          if (isFetchBaseQueryErrorLike(error)) return
          // Unexpected runtime failures are still reported for observability.
          reportRuntimeError('recovery-api:login-onQueryStarted', error)
        }
      },
    }),
    requestPasswordReset: builder.mutation<ApiMessageEnvelope<null>, RequestPasswordResetBody>({
      query: (body) => ({
        url: '/recovery/auth/request-password-reset',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<ApiMessageEnvelope<null>, ResetPasswordBody>({
      query: (body) => ({
        url: '/recovery/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    verifyFirstLoginOtp: builder.mutation<
      ApiMessageEnvelope<FirstLoginVerifyOtpContent>,
      FirstLoginVerifyOtpBody
    >({
      query: (body) => ({
        url: '/recovery/auth/first-login/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    requestFirstLoginOtp: builder.mutation<ApiMessageEnvelope<null>, FirstLoginRequestOtpBody>({
      query: (body) => ({
        url: '/recovery/auth/first-login/request-otp',
        method: 'POST',
        body,
      }),
    }),
    setupFirstLoginPassword: builder.mutation<
      ApiMessageEnvelope<null>,
      FirstLoginSetupPasswordBody
    >({
      query: (body) => ({
        url: '/recovery/auth/first-login/setup-password',
        method: 'POST',
        body,
      }),
    }),
    getRecoveryProfile: builder.query<RecoveryApiEnvelope<RecoveryUserProfile>, void>({
      query: () => ({ url: '/recovery/users/profile', method: 'GET' }),
      providesTags: [{ type: 'RecoveryProfile', id: 'ME' }],
    }),
    patchRecoveryProfile: builder.mutation<
      RecoveryApiEnvelope<RecoveryUserProfile>,
      RecoveryProfilePatchBody
    >({
      query: (body) => ({
        url: '/recovery/users/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'RecoveryProfile', id: 'ME' }],
    }),
    getRecoveryPreferences: builder.query<RecoveryApiEnvelope<RecoveryPreferences>, void>({
      query: () => ({ url: '/recovery/users/preferences', method: 'GET' }),
      providesTags: [{ type: 'RecoveryPreferences', id: 'ME' }],
    }),
    getRecoveryDashboard: builder.query<RecoveryApiEnvelope<RecoveryDashboardContent>, void>({
      query: () => ({ url: '/recovery/users/dashboard', method: 'GET' }),
    }),
    postRecoveryPreferences: builder.mutation<
      RecoveryApiEnvelope<RecoveryPreferences>,
      RecoveryPreferencesBody
    >({
      query: (body) => ({
        url: '/recovery/users/preferences',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RecoveryPreferences', id: 'ME' }],
    }),
    postRecoveryDeleteRequest: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      RecoveryDeleteRequestBody
    >({
      query: (body) => ({
        url: '/recovery/users/delete-request',
        method: 'POST',
        body,
      }),
    }),
    getRecoveryDeleteRequestStatus: builder.query<
      RecoveryApiEnvelope<RecoveryDeleteRequestStatus>,
      void
    >({
      query: () => ({
        url: '/recovery/users/delete-request/check-pending',
        method: 'GET',
      }),
    }),
    postRecoveryChangePassword: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      RecoveryChangePasswordBody
    >({
      query: (body) => ({
        url: '/recovery/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
    validateTenantSubdomain: builder.query<
      RecoveryApiEnvelope<ValidateTenantContent>,
      ValidateTenantQuery
    >({
      query: ({ tenant }) => ({
        url: '/recovery/tenants/validate',
        method: 'GET',
        params: { tenant },
      }),
      transformResponse: (response: RecoveryApiEnvelope<ValidateTenantContent>) => {
        const tenantData = response.content?.data
        if (!tenantData) return response

        return {
          ...response,
          content: {
            data: {
              ...tenantData,
            } as RecoveryTenantTheme,
          },
        }
      },
    }),
    getRecoveryInboxDocuments: builder.query<
      RecoveryInboxDocumentsListEnvelope,
      {
        page?: number
        limit?: number
        recordType?: RecoveryDocumentRecordType
      }
    >({
      query: ({ page = 1, limit = 10, recordType } = {}) => ({
        url: '/recovery/documents/combined',
        method: 'GET',
        params: {
          page,
          limit,
          ...(recordType ? { recordType } : {}),
        },
      }),
    }),
    getRecoveryInboxDocumentById: builder.query<RecoveryInboxDocumentDetailEnvelope, string>({
      query: (id) => ({
        url: `/recovery/documents/combined/${id}`,
        method: 'GET',
      }),
    }),
    getRecoveryShipmentsList: builder.query<
      RecoveryShipmentsListEnvelope,
      RecoveryShipmentsListQuery | void
    >({
      query: (params) => ({
        url: '/recovery/shipments',
        method: 'GET',
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          pageSize: params?.pageSize ?? 10,
          ...(params?.messageId ? { messageId: params.messageId } : {}),
          ...(params?.shipmentKey ? { shipmentKey: params.shipmentKey } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.dateFrom ? { dateFrom: params.dateFrom } : {}),
          ...(params?.dateTo ? { dateTo: params.dateTo } : {}),
          ...(params?.flaggedItem !== undefined ? { flaggedItem: params.flaggedItem } : {}),
          ...(params?.refundStatus ? { refundStatus: params.refundStatus } : {}),
        },
      }),
      providesTags: [{ type: 'RecoveryShipments', id: 'LIST' }],
    }),
    getRecoveryShipmentById: builder.query<RecoveryShipmentDetailEnvelope, string>({
      query: (id) => ({
        url: `/recovery/shipments/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'RecoveryShipment', id }],
    }),
    getRecoveryShipmentDownloadUrls: builder.mutation<
      RecoveryShipmentDownloadEnvelope,
      RecoveryShipmentDownloadRequest
    >({
      query: ({ id, fileType = 'both', expiresIn = 300 }) => ({
        url: `/recovery/shipments/${id}/download`,
        method: 'GET',
        params: {
          fileType,
          expiresIn,
        },
      }),
    }),
    // Streams the file through our own API (not a presigned S3 URL) so the
    // download works regardless of the source bucket's CORS config.
    downloadRecoveryShipmentFileBlob: builder.mutation<
      Blob,
      { id: string; fileType: Exclude<RecoveryShipmentDownloadFileType, 'both'> }
    >({
      query: ({ id, fileType }) => ({
        url: `/recovery/shipments/${id}/download-file`,
        method: 'GET',
        params: { fileType },
        responseHandler: (response) => response.blob(),
      }),
    }),
    getRecoveryShipmentLandedCost: builder.query<RecoveryShipmentLandedCostEnvelope, string>({
      query: (id) => ({
        url: `/recovery/shipments/landedcost/${id}`,
        method: 'POST',
      }),
    }),
    getRecoveryShipmentLogs: builder.query<RecoveryShipmentLogsEnvelope, RecoveryShipmentLogsQuery>(
      {
        query: ({ id, page = 1, limit = 10, search = '' }) => ({
          url: `/recovery/shipments/${id}/logs`,
          method: 'GET',
          params: {
            page,
            limit,
            search,
          },
        }),
      },
    ),
    /**
     * Recovery-guarded twin of trade-harmonizer `POST /shipments/upload-c88-document`.
     * Same multipart contract (FormData: file), but the shipment id is a route param and
     * the route is validated by `RecoveryJwtAuthGuard` against the `recoveryusers`
     * collection. The main-app route is guarded by the global `JwtAuthGuard`, which
     * rejected recovery bearer tokens with a misleading
     * "Your account has been deleted or does not exist" 401.
     */
    uploadRecoveryShipmentC88Document: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      { shipmentId: string; file: File }
    >({
      query: ({ shipmentId, file }) => {
        const body = new FormData()
        body.append('file', file)
        return {
          url: `/recovery/shipments/${shipmentId}/upload-c88-document`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'RecoveryShipments', id: 'LIST' },
        { type: 'RecoveryShipment', id: arg.shipmentId },
      ],
    }),
    /**
     * Recovery-guarded twin of trade-harmonizer `POST /sanctions/shipment-decision`.
     * Same body contract ({ shipmentId, decision }); the shipment is resolved against
     * `recoveryshipments` and scoped to the authenticated recovery user.
     */
    updateRecoveryShipmentSanctionDecision: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      { shipmentId: string; decision: 'stopped' | 'ignored' }
    >({
      query: (body) => ({
        url: '/recovery/shipments/sanction-decision',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'RecoveryShipments', id: 'LIST' },
        { type: 'RecoveryShipment', id: arg.shipmentId },
      ],
    }),
    /**
     * Disputes a poItems[] entry's HS code. Creates a pending RecoveryHsCodeChallenge
     * reviewed by an admin (approve/reject) in trade-harmonizer's admin console.
     */
    challengeRecoveryHsCode: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      {
        recoveryShipmentId: string
        poItemId: string
        proposedHsCode: string
        reason: string
        description?: string
      }
    >({
      query: (body) => ({
        url: '/recovery/shipments/challenge-hs-code',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'RecoveryShipment', id: arg.recoveryShipmentId },
      ],
    }),
    /**
     * Live duty-rate + preferential trade agreement lookup for a poItems[] entry (or, without
     * `itemIndex`, for every item on the shipment). Twin of trade-harmonizer's server-side
     * `attachTradeAgreement`/`TradeLookupService.lookupTrade`, exposed here as a read endpoint
     * because recovery items — unlike main-flow items — only get a `tradeAgreement` snapshot
     * persisted once a challenge on them is approved.
     */
    getRecoveryPreferentialDuty: builder.query<
      RecoveryPreferentialDutyEnvelope,
      { shipmentId: string; itemIndex?: number }
    >({
      query: ({ shipmentId, itemIndex }) => ({
        url: `/recovery/shipments/${shipmentId}/preferential-duty`,
        method: 'GET',
        params: itemIndex !== undefined ? { itemIndex } : undefined,
      }),
    }),
    moveUnprocessableToProcessable: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      { id: string; unprocessableIndex: number }
    >({
      query: ({ id, unprocessableIndex }) => ({
        url: `/recovery/documents/${id}/move-unprocessable-to-processable`,
        method: 'PATCH',
        body: { unprocessableIndex },
      }),
    }),
    moveProcessableToUnprocessable: builder.mutation<
      RecoveryApiEnvelope<unknown>,
      { id: string; processableIndex: number }
    >({
      query: ({ id, processableIndex }) => ({
        url: `/recovery/documents/${id}/move-processable-to-unprocessable`,
        method: 'PATCH',
        body: { processableIndex },
      }),
    }),
    getRecoveryDownloadUrl: builder.mutation<
      RecoveryApiEnvelope<{
        downloadUrl?: string
        bucket?: string
        key?: string
        fileName?: string
        expiresIn?: number
      }>,
      {
        id: string
        s3Key: string
        bucket: string
        recordType: RecoveryDocumentRecordType
        fileName: string
        expiresIn?: number
      }
    >({
      query: ({ id, s3Key, bucket, recordType, fileName, expiresIn = 300 }) => ({
        url: `/recovery/documents/combined/${id}/download`,
        method: 'GET',
        params: {
          s3Key,
          bucket,
          recordType,
          fileName,
          expiresIn,
        },
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useVerifyFirstLoginOtpMutation,
  useRequestFirstLoginOtpMutation,
  useSetupFirstLoginPasswordMutation,
  useGetRecoveryProfileQuery,
  usePatchRecoveryProfileMutation,
  useGetRecoveryPreferencesQuery,
  useGetRecoveryDashboardQuery,
  usePostRecoveryPreferencesMutation,
  usePostRecoveryDeleteRequestMutation,
  useGetRecoveryDeleteRequestStatusQuery,
  usePostRecoveryChangePasswordMutation,
  useLazyValidateTenantSubdomainQuery,
  useGetRecoveryInboxDocumentsQuery,
  useGetRecoveryInboxDocumentByIdQuery,
  useGetRecoveryShipmentsListQuery,
  useGetRecoveryShipmentByIdQuery,
  useGetRecoveryShipmentDownloadUrlsMutation,
  useDownloadRecoveryShipmentFileBlobMutation,
  useGetRecoveryShipmentLogsQuery,
  useLazyGetRecoveryShipmentLandedCostQuery,
  useMoveUnprocessableToProcessableMutation,
  useMoveProcessableToUnprocessableMutation,
  useGetRecoveryDownloadUrlMutation,
  useUploadRecoveryShipmentC88DocumentMutation,
  useUpdateRecoveryShipmentSanctionDecisionMutation,
  useChallengeRecoveryHsCodeMutation,
  useGetRecoveryPreferentialDutyQuery,
} = recoveryApi
