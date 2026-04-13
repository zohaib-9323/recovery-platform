import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ResetPasswordPage } from './ResetPasswordPage'

const mockResetPassword = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useResetPasswordMutation: () => [
    mockResetPassword,
    {
      isLoading: false,
    },
  ],
}))

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<p>Forgot Password Route</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    mockResetPassword.mockReset()
  })

  it('redirects to forgot-password when token is missing', () => {
    renderWithRoute('/reset-password')
    expect(screen.getByText('Forgot Password Route')).toBeInTheDocument()
  })

  it('submits token and password for valid form', async () => {
    mockResetPassword.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ status: true }),
    })

    renderWithRoute('/reset-password?token=abc123')

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'TradeHarmony1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'TradeHarmony1!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'abc123',
        newPassword: 'TradeHarmony1!',
      })
    })
  })
})
