/** Recovery `/recovery/company-users/*` API shapes (envelope matches other Recovery endpoints). */
export type ApiMessageEnvelope<T = null> = {
  statusCode?: number
  message?: string
  status?: boolean
  content: T
}

export type CompanyUserStatus = 'active' | 'suspended' | 'pending'

export type CompanyUserListItem = {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: CompanyUserStatus
  role: string
  joiningDate: string
  profilePic: string
}

export type ListCompanyUsersQuery = {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export type ListCompanyUsersContent = {
  users: CompanyUserListItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export type CompanyUserDetail = {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: CompanyUserStatus
  role: string
  profilePic: string
}

export type InviteCompanyUserBody = {
  email: string
}

export type CreateCompanyUserBody = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
}

export type CreateCompanyUserContent = {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: CompanyUserStatus
  companyName: string
}

export type InviteDetailsContent = {
  email: string
  companyName: string
}

export type AcceptInviteBody = {
  token: string
  firstName: string
  lastName: string
  phone?: string
  password: string
  termsAccepted: boolean
}

export type UpdateCompanyUserStatusBody = {
  status: 'active' | 'suspended'
  reason?: string
  description?: string
}

/** One row in the owner's delete-request queue. */
export type CompanyDeleteRequest = {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: string
  deletionRequestStatus: 'pending' | 'approved' | 'rejected'
  deletionRequestReason?: string
  deletionRequestedAt?: string | null
}

export type CompanyDeleteRequestsContent = {
  data: CompanyDeleteRequest[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Matches the admin Connections row so both screens render the same table. */
export type CompanyConnectionStatusValue =
  | 'connected'
  | 'auth_expired'
  | 'needs_reconnect'
  | 'not_connected'

/**
 * A teammate's Microsoft connection, as the owner sees it.
 *
 * Deliberately narrow: whether they are connected, which mailbox, and when it
 * last synced — never a token, and never their import data, which stays
 * private to each user.
 */
export type CompanyM365Status = {
  recoveryUserId: string
  userName: string
  userEmail: string
  connectedAccount: string | null
  connectionStatus: CompanyConnectionStatusValue
  connectedSince: string | null
  lastSync: string | null
  lastError?: string | null
}

export type CompanyM365StatusContent = {
  items: CompanyM365Status[]
  total: number
  page: number
  limit: number
  totalPages: number
}
