/** Recovery `/recovery/users/*` API shapes (envelope matches auth endpoints). */
export type RecoveryApiEnvelope<T> = {
  statusCode?: number
  message?: string
  status?: boolean
  content: T
}

export type RecoveryUserProfile = {
  firstName?: string
  lastName?: string
  email?: string
  dob?: string
  country?: string
  city?: string
  phone?: string
  profilePic?: string
}

/** PATCH body: send only fields that changed (subset of profile fields). */
export type RecoveryProfilePatchBody = Partial<{
  firstName: string
  lastName: string
  dob: string
  country: string
  city: string
  phone: string
  profilePic: string
}>

export type RecoveryPreferences = {
  currency?: string
  timezone?: string
}

export type RecoveryPreferencesBody = {
  currency: string
  timezone: string
}

export type RecoveryMetricTrend = {
  percentage: string
  increased: boolean
  trend: 'up' | 'down' | 'none'
  currentPeriodCount: number
  previousPeriodCount: number
}

export type RecoveryDashboardStats = {
  emailsReceived: number
  emailsReceivedToday: number
  emailsReceivedTrend: RecoveryMetricTrend
  shipmentsCreated: number
  shipmentsCreatedTrend: RecoveryMetricTrend
  activeShipments: number
  activeShipmentsTrend: RecoveryMetricTrend
  filesProcessed: number
  filesProcessedTrend: RecoveryMetricTrend
  trendWindowDays: number
}

export type RecoveryDashboardContent = {
  data: RecoveryDashboardStats
}

export type RecoveryDeleteRequestBody = {
  password: string
  reason: string
}

export type RecoveryChangePasswordBody = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type RecoveryTenantTheme = {
  _id: string
  subdomain: string
  name: string
  primaryColor: string
  secondaryColor: string
  textOnPrimaryColor: string
  logoUrl?: string
  status?: string
}

export type ValidateTenantQuery = {
  tenant: string
}

export type ValidateTenantContent = {
  data: RecoveryTenantTheme
}
