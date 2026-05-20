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

export type FirstLoginSetupPasswordBody = {
  setupToken: string
  temporaryPassword: string
  newPassword: string
  confirmPassword: string
}
