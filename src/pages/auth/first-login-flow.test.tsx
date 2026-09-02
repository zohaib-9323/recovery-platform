import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FirstLoginSetupPasswordPage } from './FirstLoginSetupPasswordPage'
import { FirstLoginVerifyOtpPage } from './FirstLoginVerifyOtpPage'
import { LoginPage } from './LoginPage'

/**
 * The owner-created account's first login, end to end through the real
 * endpoints: login → OTP → set new password → success popup.
 *
 * This file used to drive `first-login-mock.ts`, a client-side stand-in from
 * before the API existed. That mock defaulted ON under `NODE_ENV=development`
 * and — unlike the login page's demo short-circuit — was not scoped to the
 * demo account, so on localhost *no* user's OTP verification or password setup
 * ever reached the backend. It is deleted; these cases now assert against the
 * RTK Query hooks, which is what the screens actually call.
 */
const EMAIL = 'ali.khan@devexcelit.com'
const TEMP_PASSWORD = 'Temp@1234'
const NEW_PASSWORD = 'TradeHarmony1!'
const SETUP_TOKEN = 'setup-token-abc'

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

const mockLogin = jest.fn()
const mockVerifyFirstLoginOtp = jest.fn()
const mockRequestFirstLoginOtp = jest.fn()
const mockSetupPassword = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }],
  useVerifyFirstLoginOtpMutation: () => [mockVerifyFirstLoginOtp, { isLoading: false }],
  useRequestFirstLoginOtpMutation: () => [mockRequestFirstLoginOtp, { isLoading: false }],
  useSetupFirstLoginPasswordMutation: () => [mockSetupPassword, { isLoading: false }],
  useVerifySignupOtpMutation: () => [jest.fn(), { isLoading: false }],
}))

function makeTestStore() {
  return configureStore({
    reducer: (state = { auth: { user: null, token: null, status: 'idle' } }) => state,
  })
}

function renderFlow() {
  return render(
    <Provider store={makeTestStore()}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/first-login/verify-otp" element={<FirstLoginVerifyOtpPage />} />
          <Route path="/first-login/setup-password" element={<FirstLoginSetupPasswordPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: EMAIL } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: TEMP_PASSWORD } })
  fireEvent.click(screen.getByRole('button', { name: 'Login' }))
}

function typeOtp(otp: string) {
  const boxes = screen.getAllByLabelText(/OTP Code \d/)
  otp.split('').forEach((digit, index) => {
    fireEvent.change(boxes[index], { target: { value: digit } })
  })
}

/** The 403 the API returns for an account still holding a one-time password. */
function loginNeedsPasswordSetup() {
  mockLogin.mockReturnValue({
    unwrap: jest.fn().mockRejectedValue({
      status: 403,
      data: {
        statusCode: 403,
        message: 'First login password setup required',
        status: false,
        content: { passwordResetRequired: true, otpRequired: true, email: EMAIL },
      },
    }),
  })
}

describe('first-login flow (real endpoints)', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockVerifyFirstLoginOtp.mockReset()
    mockRequestFirstLoginOtp.mockReset()
    mockSetupPassword.mockReset()
    window.sessionStorage.clear()
  })

  it('routes a 403 password-setup login to the OTP screen', async () => {
    loginNeedsPasswordSetup()
    renderFlow()
    submitLogin()

    expect(await screen.findByRole('heading', { name: 'OTP Verification' })).toBeInTheDocument()
    expect(mockLogin).toHaveBeenCalledWith({ email: EMAIL, password: TEMP_PASSWORD })
  })

  it('actually calls the verify-otp endpoint', async () => {
    // The regression this file exists for: the mock used to answer here, so
    // the request never left the browser on localhost.
    loginNeedsPasswordSetup()
    mockVerifyFirstLoginOtp.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ content: { setupToken: SETUP_TOKEN } }),
    })
    renderFlow()
    submitLogin()
    await screen.findByRole('heading', { name: 'OTP Verification' })

    typeOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Verify and Proceed' }))

    await waitFor(() => {
      expect(mockVerifyFirstLoginOtp).toHaveBeenCalledWith({ email: EMAIL, otp: '123456' })
    })
  })

  it('runs OTP → set new password → success popup', async () => {
    loginNeedsPasswordSetup()
    mockVerifyFirstLoginOtp.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ content: { setupToken: SETUP_TOKEN } }),
    })
    mockSetupPassword.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

    renderFlow()
    submitLogin()
    await screen.findByRole('heading', { name: 'OTP Verification' })

    typeOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Verify and Proceed' }))
    expect(
      await screen.findByText('Set New Password', undefined, { timeout: 3000 }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Temporary Password'), {
      target: { value: TEMP_PASSWORD },
    })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: NEW_PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: NEW_PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Set Password' }))

    await waitFor(() => {
      expect(mockSetupPassword).toHaveBeenCalledWith({
        setupToken: SETUP_TOKEN,
        temporaryPassword: TEMP_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    })
    expect(
      await screen.findByText('Password Set Successfully!', undefined, { timeout: 3000 }),
    ).toBeInTheDocument()
  })

  it('shows the API error when the OTP is rejected', async () => {
    loginNeedsPasswordSetup()
    mockVerifyFirstLoginOtp.mockReturnValue({
      unwrap: jest
        .fn()
        .mockRejectedValue({ data: { message: 'Invalid or expired OTP. Please try again.' } }),
    })
    renderFlow()
    submitLogin()
    await screen.findByRole('heading', { name: 'OTP Verification' })

    typeOtp('000000')
    fireEvent.click(screen.getByRole('button', { name: 'Verify and Proceed' }))

    expect(
      await screen.findByText('Invalid or expired OTP. Please try again.', undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument()
  })

  it('shows the API error when the temporary password is wrong', async () => {
    loginNeedsPasswordSetup()
    mockVerifyFirstLoginOtp.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ content: { setupToken: SETUP_TOKEN } }),
    })
    mockSetupPassword.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ data: { message: 'Temporary password is incorrect' } }),
    })

    renderFlow()
    submitLogin()
    await screen.findByRole('heading', { name: 'OTP Verification' })
    typeOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Verify and Proceed' }))
    await screen.findByText('Set New Password', undefined, { timeout: 3000 })

    fireEvent.change(screen.getByLabelText('Temporary Password'), {
      target: { value: 'NotTheTempPassword1!' },
    })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: NEW_PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: NEW_PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Set Password' }))

    expect(
      await screen.findByText('Temporary password is incorrect', undefined, { timeout: 3000 }),
    ).toBeInTheDocument()
  })
})
