/**
 * Create React App exposes env vars prefixed with REACT_APP_ via process.env
 * @see https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
export const env = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL ?? '',
  appName: process.env.REACT_APP_APP_NAME ?? 'Recovery Platform',
} as const
