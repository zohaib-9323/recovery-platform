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
} = recoveryCompanyUsersApi
