import { isAllowedRedirectUrl } from './safe-redirect'

describe('isAllowedRedirectUrl', () => {
  it('rejects javascript: URLs', () => {
    expect(isAllowedRedirectUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isAllowedRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects http on non-localhost hosts', () => {
    expect(isAllowedRedirectUrl('http://evil.com')).toBe(false)
  })

  it('rejects https on unrelated hosts', () => {
    expect(isAllowedRedirectUrl('https://evil.com')).toBe(false)
  })

  it('rejects look-alike hosts that only contain the suffix elsewhere', () => {
    expect(isAllowedRedirectUrl('https://tradeharmonizer.co.uk.evil.com')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isAllowedRedirectUrl('not a url')).toBe(false)
    expect(isAllowedRedirectUrl('')).toBe(false)
  })

  it('allows https tenant subdomains on the tradeharmonizer domain', () => {
    expect(isAllowedRedirectUrl('https://acme.recovery.tradeharmonizer.co.uk/login')).toBe(true)
  })

  it('allows the apex tradeharmonizer domain', () => {
    expect(isAllowedRedirectUrl('https://tradeharmonizer.co.uk/login')).toBe(true)
  })

  it('allows the default main site url', () => {
    expect(isAllowedRedirectUrl('https://recovery.tradeharmonizer.co.uk/login')).toBe(true)
  })

  it('allows http only for localhost dev', () => {
    expect(isAllowedRedirectUrl('http://localhost:3000/login')).toBe(true)
    expect(isAllowedRedirectUrl('http://127.0.0.1:3000/login')).toBe(true)
  })
})
