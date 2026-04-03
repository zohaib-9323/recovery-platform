/**
 * Vite exposes env vars prefixed with VITE_ via import.meta.env
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  appName: import.meta.env.VITE_APP_NAME ?? 'Recovery Platform',
} as const
