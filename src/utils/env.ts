/**
 * Create React App exposes env vars prefixed with REACT_APP_ via process.env
 * @see https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  apiBaseUrl: requireEnv('REACT_APP_API_BASE_URL'),
  appName: process.env.REACT_APP_APP_NAME ?? 'Recovery Platform',
  mainSiteUrl:
    process.env.REACT_APP_MAIN_SITE_URL ?? 'https://recovery.tradeharmonizer.co.uk/login',
  tenantValidatePath: process.env.REACT_APP_TENANT_VALIDATE_PATH ?? '/tenants/validate',
  recoveryTenantValidatePath:
    process.env.REACT_APP_RECOVERY_TENANT_VALIDATE_PATH ?? '/recovery/tenants/validate',
} as const
