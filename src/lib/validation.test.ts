import { isValidEmail, isValidPassword } from './validation'

describe('isValidEmail', () => {
  it('accepts common valid addresses', () => {
    expect(isValidEmail('user@recovery.co')).toBe(true)
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('name+tag@example.com')).toBe(true)
  })

  it('rejects invalid addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@nodomain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('accepts TradeHarmony1! style passwords', () => {
    expect(isValidPassword('TradeHarmony1!')).toBe(true)
  })

  it('rejects short or simple passwords', () => {
    expect(isValidPassword('short1!')).toBe(false)
    expect(isValidPassword('alllowercase1!')).toBe(false)
    expect(isValidPassword('ALLUPPER1!')).toBe(false)
    expect(isValidPassword('NoDigits!')).toBe(false)
    expect(isValidPassword('NoSpecial1')).toBe(false)
  })
})
