import { recoveryApi } from '@/app/services/recoveryApi'
import type {
  AcceptInviteBody,
  ApiMessageEnvelope,
  CreateCompanyUserBody,
  CreateCompanyUserContent,
  InviteCompanyUserBody,
  InviteDetailsContent,
  ListCompanyUsersContent,
  ListCompanyUsersQuery,
  CompanyDeleteRequestsContent,
  CompanyM365StatusContent,
  CompanyUserDetail,
  UpdateCompanyUserStatusBody,
} from '@/types/recovery-company-users-api'

const recoveryCompanyUsersApi = recoveryApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Owner-only: send a same-domain invitation email (stateless token, 7d expiry). */
    inviteCompanyUser: builder.mutation<
      ApiMessageEnvelope<{ status: boolean }>,
      InviteCompanyUserBody
    >({
      query: (body) => ({
        url: '/recovery/company-users/invite',
        method: 'POST',
        body,
      }),
    }),
    /** Public: validate an invite token and prefill the accept-invite screen. */
    getInviteDetails: builder.query<ApiMessageEnvelope<InviteDetailsContent>, string>({
      query: (token) => ({
        url: '/recovery/company-users/invite-details',
        method: 'GET',
        params: { token },
      }),
    }),
    /** Public: complete registration from an invite link. */
    acceptInvite: builder.mutation<ApiMessageEnvelope<{ status: boolean }>, AcceptInviteBody>({
      query: (body) => ({
        url: '/recovery/company-users/accept-invite',
        method: 'POST',
        body,
      }),
    }),
    /** Owner-only: create a same-domain user directly with a temp password. */
    createCompanyUser: builder.mutation<
      ApiMessageEnvelope<CreateCompanyUserContent>,
      CreateCompanyUserBody
    >({
      query: (body) => ({
        url: '/recovery/company-users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RecoveryCompanyUsers'],
    }),
    /** Owner-only: paginated/searchable list of users under the owner's company. */
    listCompanyUsers: builder.query<
      ApiMessageEnvelope<ListCompanyUsersContent>,
      ListCompanyUsersQuery
    >({
      query: (params) => ({
        url: '/recovery/company-users',
        method: 'GET',
        params,
      }),
      providesTags: ['RecoveryCompanyUsers'],
    }),
    /** Owner-only: single company user's profile. */
    getCompanyUserDetail: builder.query<ApiMessageEnvelope<{ user: CompanyUserDetail }>, string>({
      query: (id) => ({
        url: `/recovery/company-users/${id}`,
        method: 'GET',
      }),
    }),
    /** Owner-only: suspend/reactivate a company user (no hard delete). */
    updateCompanyUserStatus: builder.mutation<
      ApiMessageEnvelope<{ status: boolean }>,
      { id: string; body: UpdateCompanyUserStatusBody }
    >({
      query: ({ id, body }) => ({
        url: `/recovery/company-users/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['RecoveryCompanyUsers'],
    }),

    /**
     * Delete requests raised by the owner's own team. A Company Owner's own
     * request goes to the platform admin instead, so it never appears here.
     */
    listCompanyDeleteRequests: builder.query<
      ApiMessageEnvelope<CompanyDeleteRequestsContent>,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/recovery/company-users/delete-requests',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['RecoveryCompanyUsers'],
    }),

    decideCompanyDeleteRequest: builder.mutation<
      ApiMessageEnvelope<{ userId: string; status: string }>,
      { id: string; decision: 'approve' | 'reject' }
    >({
      query: ({ id, decision }) => ({
        url: `/recovery/company-users/delete-requests/${id}/${decision}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['RecoveryCompanyUsers'],
    }),

    /**
     * Microsoft connection status for every teammate. Import jobs stay private
     * per user; this only reports whether each account is connected, so an
     * owner can spot a lapsed connection that has quietly stopped that
     * person's shipments arriving.
     */
    listCompanyM365Status: builder.query<
      ApiMessageEnvelope<CompanyM365StatusContent>,
      { page?: number; limit?: number; status?: string; search?: string } | void
    >({
      query: (params) => ({
        url: '/recovery/m365/company-status',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['RecoveryCompanyUsers'],
    }),
  }),
})

export const {
  useInviteCompanyUserMutation,
  useGetInviteDetailsQuery,
  useAcceptInviteMutation,
  useCreateCompanyUserMutation,
  useListCompanyUsersQuery,
  useGetCompanyUserDetailQuery,
  useUpdateCompanyUserStatusMutation,
  useListCompanyDeleteRequestsQuery,
  useDecideCompanyDeleteRequestMutation,
  useListCompanyM365StatusQuery,
} = recoveryCompanyUsersApi
