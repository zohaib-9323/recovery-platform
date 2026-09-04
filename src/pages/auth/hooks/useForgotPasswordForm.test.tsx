import { act, renderHook } from '@testing-library/react'

import { useForgotPasswordForm } from './useForgotPasswordForm'

const mockRequestReset = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useRequestPasswordResetMutation: () => [
    mockRequestReset,
    {
      isLoading: false,
    },
  ],
}))

describe('useForgotPasswordForm', () => {
  beforeEach(() => {
    mockRequestReset.mockReset()
  })

  it('shows validation error for invalid email', async () => {
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => result.current.onEmailChange('bad-email'))

    await act(async () => {
      await result.current.submitResetRequest()
    })

    expect(result.current.error).toBe('Please enter a valid email address.')
  })

  it('surfaces backend message on failure', async () => {
    mockRequestReset.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ data: { message: 'No account' } }),
    })

    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => result.current.onEmailChange('user@example.com'))

    await act(async () => {
      await result.current.submitResetRequest()
    })

    expect(result.current.error).toBe('No account')
  })

  it('opens the success panel and names the address the link went to', async () => {
    mockRequestReset.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) })

    const { result } = renderHook(() => useForgotPasswordForm())
    // Padded on purpose: the submitted address is the trimmed one, and it is
    // echoed back to the user — a stray space would show in the copy.
    act(() => result.current.onEmailChange(' user@example.com '))

    let submitted = false
    await act(async () => {
      submitted = await result.current.submitResetRequest()
    })

    expect(submitted).toBe(true)
    expect(result.current.showSuccess).toBe(true)
    expect(result.current.successDescription).toContain('user@example.com')
    expect(result.current.error).toBeNull()
  })

  it('describes the sent email generically until one has actually been sent', () => {
    const { result } = renderHook(() => useForgotPasswordForm())

    expect(result.current.successDescription).toBe(
      "We've sent an email with password reset instructions.",
    )
  })

  it('closes the success panel without clearing the typed address', async () => {
    mockRequestReset.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) })

    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => result.current.onEmailChange('user@example.com'))
    await act(async () => {
      await result.current.submitResetRequest()
    })

    act(() => result.current.closeSuccess())

    expect(result.current.showSuccess).toBe(false)
    expect(result.current.email).toBe('user@example.com')
  })

  it('resends to the address already submitted, then drops back out of the success panel', async () => {
    mockRequestReset.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) })

    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => result.current.onEmailChange('user@example.com'))
    await act(async () => {
      await result.current.submitResetRequest()
    })

    await act(async () => {
      await result.current.resendFromSuccess()
    })

    expect(mockRequestReset).toHaveBeenCalledTimes(2)
    expect(mockRequestReset).toHaveBeenLastCalledWith({ email: 'user@example.com' })
    // Back to the form, so a second send is visible rather than silently
    // repeating behind an unchanged panel.
    expect(result.current.showSuccess).toBe(false)
  })

  it('refuses to resend when there is no valid address to resend to', async () => {
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => result.current.onEmailChange('bad-email'))

    await act(async () => {
      await result.current.resendFromSuccess()
    })

    expect(mockRequestReset).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Please enter a valid email address.')
  })

  it('reports a failed resend and drops out of the success panel', async () => {
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => result.current.onEmailChange('user@example.com'))

    mockRequestReset.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) })
    await act(async () => {
      await result.current.submitResetRequest()
    })

    mockRequestReset.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ data: { message: 'Too many requests' } }),
    })
    await act(async () => {
      await result.current.resendFromSuccess()
    })

    expect(result.current.error).toBe('Too many requests')
    // Leaving the panel open would hide the error behind it.
    expect(result.current.showSuccess).toBe(false)
  })
})
