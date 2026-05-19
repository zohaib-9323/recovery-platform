import { messages } from './messages'

type Params = Record<string, string | number>

function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined ? '' : String(value)
  })
}

export function t(key: string, params?: Params): string {
  const value = messages[key] ?? key
  return interpolate(value, params)
}

export function useI18n() {
  return { t }
}
