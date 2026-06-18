import { act, renderHook } from '@testing-library/react'

import { useResetPasswordForm } from './useResetPasswordForm'

const mockResetPassword = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useResetPasswordMutation: () => [
    mockResetPassword,
    {
      isLoading: false,
    },
  ],
}))

describe('useResetPasswordForm', () => {
  beforeEach(() => {
    mockResetPassword.mockReset()
  })

  it('blocks submit when passwords are invalid', async () => {
    const { result } = renderHook(() => useResetPasswordForm({ token: 'abc' }))
    act(() => {
      result.current.setNewPassword('short')
      result.current.setConfirmPassword('short')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(result.current.error).toBe('Please fix the highlighted fields.')
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('submits valid payload and opens success popup', async () => {
    mockResetPassword.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ status: true }),
    })
    const { result } = renderHook(() => useResetPasswordForm({ token: 'abc' }))
    act(() => {
      result.current.setNewPassword('TradeHarmony1!')
      result.current.setConfirmPassword('TradeHarmony1!')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(mockResetPassword).toHaveBeenCalledWith({
      token: 'abc',
      newPassword: 'TradeHarmony1!',
    })
    expect(result.current.showSuccess).toBe(true)
  })
})
