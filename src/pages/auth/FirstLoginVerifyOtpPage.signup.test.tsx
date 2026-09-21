import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FirstLoginVerifyOtpPage } from './FirstLoginVerifyOtpPage'

/** Covers the signup branch specifically: it must hit the real
 * verifySignupOtp mutation (not the first-login mock) and must not offer a
 * resend action, since there is no resend-OTP-for-signup endpoint. */

jest.mock('@/utils/env', () => ({
  env: {
    apiBaseUrl: 'https://api.test',
    appName: 'Recovery Platform',
    mainSiteUrl: 'https://recovery.test/login',
    tenantValidatePath: '/tenants/validate',
    recoveryTenantValidatePath: '/recovery/tenants/validate',
    firebase: {},
  },
}))

const mockVerifyFirstLoginOtp = jest.fn()
const mockRequestFirstLoginOtp = jest.fn()
const mockVerifySignupOtp = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useVerifyFirstLoginOtpMutation: () => [mockVerifyFirstLoginOtp, { isLoading: false }],
  useRequestFirstLoginOtpMutation: () => [mockRequestFirstLoginOtp, { isLoading: false }],
  useVerifySignupOtpMutation: () => [mockVerifySignupOtp, { isLoading: false }],
}))

function makeTestStore() {
  return configureStore({
    reducer: (state = { auth: { user: null, token: null, status: 'idle' } }) => state,
  })
}

function renderSignupOtp() {
  return render(
    <Provider store={makeTestStore()}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/first-login/verify-otp',
            state: { email: 'jane@acmecorp.com', fromSignup: true },
          },
        ]}
      >
        <Routes>
          <Route path="/first-login/verify-otp" element={<FirstLoginVerifyOtpPage />} />
          <Route path="/signup" element={<p>Signup Route</p>} />
          <Route path="/login" element={<p>Login Route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('FirstLoginVerifyOtpPage — signup branch', () => {
  beforeEach(() => {
    mockVerifyFirstLoginOtp.mockReset()
    mockRequestFirstLoginOtp.mockReset()
    mockVerifySignupOtp.mockReset()
    sessionStorage.clear()
  })

  it('shows a countdown, then a restart-signup link instead of a resend action', () => {
    jest.useFakeTimers()
    renderSignupOtp()

    expect(screen.getByText('5:00')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Restart signup' })).not.toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(300_000)
    })

    expect(screen.getByRole('link', { name: 'Restart signup' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resend/i })).not.toBeInTheDocument()
    jest.useRealTimers()
  })

  it('calls the real verifySignupOtp mutation on submit, not the first-login mock', async () => {
    mockVerifySignupOtp.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
    renderSignupOtp()

    const digitInputs = screen.getAllByLabelText(/code \d/i)
    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(digitInputs[i], { target: { value: digit } })
    })

    fireEvent.click(screen.getByRole('button', { name: /verify/i }))

    expect(await screen.findByText('Email Verified Successfully!')).toBeInTheDocument()
    expect(mockVerifySignupOtp).toHaveBeenCalledWith({ email: 'jane@acmecorp.com', otp: '123456' })
    expect(mockVerifyFirstLoginOtp).not.toHaveBeenCalled()
  })
})
