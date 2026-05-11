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
})
