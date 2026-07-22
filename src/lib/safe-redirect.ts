const ALLOWED_HOST_SUFFIX = '.tradeharmonizer.co.uk'

/** True only for https URLs on the tradeharmonizer domain (http allowed for localhost dev). */
export function isAllowedRedirectUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    if (url.protocol === 'http:') {
      return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    }
    if (url.protocol !== 'https:') {
      return false
    }
    return url.hostname === 'tradeharmonizer.co.uk' || url.hostname.endsWith(ALLOWED_HOST_SUFFIX)
  } catch {
    return false
  }
}
