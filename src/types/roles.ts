/** Recovery Platform user roles — must match the backend's exact string values
 * (`src/recovery/users/recovery-user.constants.ts` in trade-harmonizer-be). */
export const RECOVERY_COMPANY_OWNER = 'recovery_company_owner' as const
export const RECOVERY_COMPANY_USER = 'recovery_company_user' as const

export const RECOVERY_USER_ROLES = [RECOVERY_COMPANY_OWNER, RECOVERY_COMPANY_USER] as const

export type RecoveryUserRole = (typeof RECOVERY_USER_ROLES)[number]
