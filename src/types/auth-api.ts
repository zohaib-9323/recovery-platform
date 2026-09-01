/** Recovery API auth envelope (login / refresh). */
export type RecoveryAuthContent = {
  status?: boolean
  access_token: string
  refresh_token: string
}

export type RecoveryAuthEnvelope = {
  statusCode?: number
  message?: string
  status?: boolean
  content: RecoveryAuthContent
}

export type ApiMessageEnvelope<TContent = null> = {
  statusCode?: number
  message?: string
  status?: boolean
  content: TContent
}

export type LoginRequestBody = {
  email: string
  password: string
}

export type RefreshRequestBody = {
  refreshToken: string
}

export type RequestPasswordResetBody = {
  email: string
}

export type ResetPasswordBody = {
  token: string
  newPassword: string
}

export type FirstLoginVerifyOtpBody = {
  email: string
  otp: string
}

export type FirstLoginVerifyOtpContent = {
  setupToken: string
}

export type FirstLoginRequestOtpBody = {
  email: string
}

export type RegisterRecoveryUserBody = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  companyName: string
  tenant?: string
  termsAccepted: boolean
  /**
   * "Company Details" section. Optional on the wire — the backend DTO keeps
   * them optional so it does not reject callers that predate them — but the
   * signup form requires all except website, address2 and status.
   */
  companyEmail?: string
  companyWebsite?: string
  address1?: string
  address2?: string
  country?: string
  city?: string
  postalCode?: string
  companyPhone?: string
  status?: 'active' | 'inactive'
}

export type RegisterRecoveryUserContent = {
  recoveryUserId: string
  email: string
}

export type VerifySignupOtpBody = {
  email: string
  otp: string
}

export type VerifySignupOtpContent = {
  recoveryUserId: string
  email: string
  role: string
}

export type FirstLoginSetupPasswordBody = {
  setupToken: string
  temporaryPassword: string
  newPassword: string
  confirmPassword: string
}
