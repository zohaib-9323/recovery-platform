import { recoveryApi } from '@/app/services/recoveryApi'
import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'
import type {
  RecoveryNotificationCountsEnvelope,
  RecoveryNotificationsListEnvelope,
  RecoveryNotificationsListQuery,
} from '@/types/recovery-notifications-api'

const recoveryNotificationsApi = recoveryApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecoveryNotifications: builder.query<
      RecoveryNotificationsListEnvelope,
      RecoveryNotificationsListQuery | void
    >({
      query: (params) => ({
        url: '/recovery/notifications',
        method: 'POST',
        body: {
          status: params?.status ?? 0,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          ...(params?.search ? { search: params.search } : {}),
        },
      }),
      providesTags: [{ type: 'RecoveryNotifications', id: 'LIST' }],
    }),
    getRecoveryNotificationCounts: builder.query<RecoveryNotificationCountsEnvelope, void>({
      query: () => ({
        url: '/recovery/notifications/counts',
        method: 'GET',
      }),
      providesTags: [{ type: 'RecoveryNotifications', id: 'COUNTS' }],
    }),
    markRecoveryNotificationAsRead: builder.mutation<RecoveryApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/recovery/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'RecoveryNotifications', id: 'LIST' },
        { type: 'RecoveryNotifications', id: 'COUNTS' },
      ],
    }),
    markAllRecoveryNotificationsAsRead: builder.mutation<RecoveryApiEnvelope<unknown>, void>({
      query: () => ({
        url: '/recovery/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'RecoveryNotifications', id: 'LIST' },
        { type: 'RecoveryNotifications', id: 'COUNTS' },
      ],
    }),
  }),
})

export const {
  useGetRecoveryNotificationsQuery,
  useGetRecoveryNotificationCountsQuery,
  useMarkRecoveryNotificationAsReadMutation,
  useMarkAllRecoveryNotificationsAsReadMutation,
} = recoveryNotificationsApi
