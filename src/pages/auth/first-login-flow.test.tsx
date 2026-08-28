import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FirstLoginSetupPasswordPage } from './FirstLoginSetupPasswordPage'
import { FirstLoginVerifyOtpPage } from './FirstLoginVerifyOtpPage'
import { LoginPage } from './LoginPage'

/**
 * Covers the demo (`REACT_APP_FIRST_LOGIN_MOCK`) path end to end: login with the
 * demo account → OTP → set new password → success popup. Delete alongside
 * `first-login-mock.ts` once the real endpoints exist, and re-point these cases
 * at the RTK Query hooks.
 */
const MOCK_EMAIL = 'demo-user@example.com'
const MOCK_TEMP_PASSWORD = 'Test@123'
const NEW_PASSWORD = 'TradeHarmony1!'

jest.mock('@/utils/env', () => ({
  env: {
    apiBaseUrl: 'https://api.test',
    appName: 'Recovery Platform',
    mainSiteUrl: 'https://recovery.test/login',
    tenantValidatePath: '/tenants/validate',
    recoveryTenantValidatePath: '/recovery/tenants/validate',
    firstLoginMock: true,
    firstLoginMockEmail: 'demo-user@example.com',
    firstLoginMockPassword: 'Test@123',
    firebase: {},
  },
}))

const mockLogin = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }],
  useVerifyFirstLoginOtpMutation: () => [jest.fn(), { isLoading: false }],
  useRequestFirstLoginOtpMutation: () => [jest.fn(), { isLoading: false }],
  useSetupFirstLoginPasswordMutation: () => [jest.fn(), { isLoading: false }],
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

function submitLogin(password: string) {
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: MOCK_EMAIL } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Login' }))
}

function typeOtp(otp: string) {
  const boxes = screen.getAllByLabelText(/OTP Code \d/)
  otp.split('').forEach((digit, index) => {
    fireEvent.change(boxes[index], { target: { value: digit } })
  })
}

describe('first-login mock flow', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    window.sessionStorage.clear()
  })

  it('sends the demo account to the OTP screen without calling the login API', async () => {
    renderFlow()
    submitLogin(MOCK_TEMP_PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Email Verification' })).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('keeps the demo account on the login screen when the password is wrong', async () => {
    renderFlow()
    submitLogin('WrongPassword1!')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('heading', { name: 'Email Verification' })).not.toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('rejects the 000000 demo OTP and shows the error state', async () => {
    renderFlow()
    submitLogin(MOCK_TEMP_PASSWORD)
    await screen.findByRole('heading', { name: 'Email Verification' })

    typeOtp('000000')
    fireEvent.click(screen.getByRole('button', { name: 'Verify and Proceed' }))

    expect(
      await screen.findByText('Invalid or expired OTP. Please try again.', undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument()
  })

  it('runs OTP → set new password → success popup', async () => {
    renderFlow()
    submitLogin(MOCK_TEMP_PASSWORD)
    await screen.findByRole('heading', { name: 'Email Verification' })

    typeOtp('123456')
    fireEvent.click(screen.getByRole('button', { name: 'Verify and Proceed' }))

    expect(
      await screen.findByText('Set New Password', undefined, { timeout: 3000 }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Temporary Password'), {
      target: { value: MOCK_TEMP_PASSWORD },
    })
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: NEW_PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: NEW_PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Set Password' }))

    expect(
      await screen.findByText('Password Set Successfully!', undefined, { timeout: 3000 }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go to Login' }))
    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument()
  })

  it('rejects a wrong temporary password on the set-password screen', async () => {
    renderFlow()
    submitLogin(MOCK_TEMP_PASSWORD)
    await screen.findByRole('heading', { name: 'Email Verification' })

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
      await screen.findByText('Temporary password is incorrect.', undefined, { timeout: 3000 }),
    ).toBeInTheDocument()
  })
})
