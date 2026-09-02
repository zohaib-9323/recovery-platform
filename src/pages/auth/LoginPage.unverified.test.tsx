import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FirstLoginVerifyOtpPage } from './FirstLoginVerifyOtpPage'
import { LoginPage } from './LoginPage'
import { readFirstLoginFlowState } from './first-login-flow'

/**
 * The abandoned-signup / abandoned-invite login path.
 *
 * Someone accepts an invite (or self-signs up), fills the form, then closes the
 * tab before entering the emailed code. Their account exists with the password
 * they chose but `is_otp_verified: false`, so the next login returns 403 with
 * `otpRequired` — and the backend has already re-sent the code by then.
 *
 * This used to surface as "Invalid credentials": the login page matched
 * `/first login/i` against the 403's message, which caught
 * "First login password setup required" but not "Email verification required".
 * A correct password reported as invalid, with no way forward.
 */
jest.mock('@/utils/env', () => ({
  env: {
    apiBaseUrl: 'https://api.test',
    appName: 'Recovery Platform',
    mainSiteUrl: 'https://recovery.test/login',
    tenantValidatePath: '/tenants/validate',
    recoveryTenantValidatePath: '/recovery/tenants/validate',
    // The real path, not the demo shortcut.
    firebase: {},
  },
}))

const mockLogin = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }],
  useVerifyFirstLoginOtpMutation: () => [jest.fn(), { isLoading: false }],
  useRequestFirstLoginOtpMutation: () => [jest.fn(), { isLoading: false }],
  useSetupFirstLoginPasswordMutation: () => [jest.fn(), { isLoading: false }],
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
          <Route path="/dashboard" element={<p>Dashboard Route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'ali.khan@devexcelit.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'TradeHarmony1!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Login' }))
}

function rejectWith(data: Record<string, unknown>) {
  mockLogin.mockReturnValue({ unwrap: jest.fn().mockRejectedValue({ status: 403, data }) })
}

describe('LoginPage — account exists but email never verified', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    window.sessionStorage.clear()
  })

  const emailVerificationBlock = {
    statusCode: 403,
    message: 'Email verification required',
    status: false,
    content: { otpRequired: true, email: 'ali.khan@devexcelit.com' },
  }

  it('sends them to the OTP screen instead of claiming the credentials are invalid', async () => {
    rejectWith(emailVerificationBlock)
    renderFlow()
    submitLogin()

    expect(await screen.findAllByLabelText(/OTP Code \d/)).toHaveLength(6)
  })

  it('marks the run verify-only, so they keep the password they chose', async () => {
    rejectWith(emailVerificationBlock)
    renderFlow()
    submitLogin()

    await waitFor(() => {
      expect(readFirstLoginFlowState()).toMatchObject({
        email: 'ali.khan@devexcelit.com',
        fromSignup: true,
      })
    })
  })

  it('still routes an owner-created account through password setup', async () => {
    // passwordResetRequired wins: this account's password is a one-time one
    // and genuinely has to be replaced.
    rejectWith({
      statusCode: 403,
      message: 'First login password setup required',
      status: false,
      content: {
        passwordResetRequired: true,
        otpRequired: true,
        email: 'ali.khan@devexcelit.com',
      },
    })
    renderFlow()
    submitLogin()

    await waitFor(() => {
      expect(readFirstLoginFlowState()).toMatchObject({ email: 'ali.khan@devexcelit.com' })
    })
    // Not the verify-only variant, so the OTP screen goes on to set-password.
    expect(readFirstLoginFlowState()?.fromSignup).toBeFalsy()
  })

  it('routes on the message alone when the filter stripped the flags', async () => {
    // The exact body the API returned in the field: HttpExceptionFilter rebuilds
    // every error as {statusCode, message, status, content} and dropped the
    // flags, which left a correct password showing "Invalid credentials".
    rejectWith({
      statusCode: 403,
      message: 'First login password setup required',
      status: false,
      content: null,
    })
    renderFlow()
    submitLogin()

    expect(await screen.findAllByLabelText(/OTP Code \d/)).toHaveLength(6)
  })

  it('routes a flagless email-verification 403 on its message too', async () => {
    rejectWith({
      statusCode: 403,
      message: 'Email verification required',
      status: false,
      content: null,
    })
    renderFlow()
    submitLogin()

    expect(await screen.findAllByLabelText(/OTP Code \d/)).toHaveLength(6)
  })

  it('routes when the body arrives unwrapped, without the RTK envelope', async () => {
    // Not every failure path wraps the body in `{ status, data }`. Guessing one
    // shape is what turns a valid login into "invalid credentials".
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        statusCode: 403,
        message: 'First login password setup required',
        status: false,
        content: null,
      }),
    })
    renderFlow()
    submitLogin()

    expect(await screen.findAllByLabelText(/OTP Code \d/)).toHaveLength(6)
  })

  it('leaves a genuine 401 as an invalid-credentials error', async () => {
    mockLogin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        status: 401,
        data: { statusCode: 401, message: 'Invalid credentials' },
      }),
    })
    renderFlow()
    submitLogin()

    await waitFor(() => {
      expect(readFirstLoginFlowState()).toBeNull()
    })
    expect(screen.queryAllByLabelText(/OTP Code \d/)).toHaveLength(0)
  })
})
