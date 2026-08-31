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
