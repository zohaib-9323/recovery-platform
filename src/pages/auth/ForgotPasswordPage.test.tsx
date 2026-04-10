import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ForgotPasswordPage } from './ForgotPasswordPage'

const mockRequestReset = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useRequestPasswordResetMutation: () => [
    mockRequestReset,
    {
      isLoading: false,
    },
  ],
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mockRequestReset.mockReset()
  })

  it('submits valid email to request password reset', async () => {
    mockRequestReset.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ status: true }),
    })

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(mockRequestReset).toHaveBeenCalledWith({ email: 'user@example.com' })
    })
  })

  it('shows API error message when reset request fails', async () => {
    mockRequestReset.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ data: { message: 'Email not found' } }),
    })

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument()
    })
  })
})
