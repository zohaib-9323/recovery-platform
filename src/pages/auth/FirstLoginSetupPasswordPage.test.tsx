import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FirstLoginSetupPasswordPage } from './FirstLoginSetupPasswordPage'
import { saveFirstLoginFlowState } from './first-login-flow'

/**
 * Covers the real `POST /recovery/auth/first-login/setup-password` integration.
 *
 * The screen previously disabled its own submit button until every field was
 * valid, so a click with anything missing did nothing at all: no request, no
 * error, no feedback. Submitting now always runs, and says what is wrong.
 */
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

const mockSetupPassword = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useSetupFirstLoginPasswordMutation: () => [mockSetupPassword, { isLoading: false }],
}))

function makeTestStore() {
  return configureStore({
    reducer: (state = { auth: { user: null, token: null, status: 'idle' } }) => state,
  })
}

function renderPage() {
  return render(
    <Provider store={makeTestStore()}>
      <MemoryRouter initialEntries={['/first-login/setup-password']}>
        <Routes>
          <Route path="/first-login/setup-password" element={<FirstLoginSetupPasswordPage />} />
          <Route path="/login" element={<p>Login Route</p>} />
          <Route path="/first-login/verify-otp" element={<p>Verify OTP Route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

const NEW_PASSWORD = 'TradeHarmony1!'

function fill({ temporary = 'Temp@1234', next = NEW_PASSWORD, confirm = NEW_PASSWORD } = {}) {
  if (temporary) {
    fireEvent.change(screen.getByLabelText('Temporary Password'), {
      target: { value: temporary },
    })
  }
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: next } })
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: confirm } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Set Password' }))
}

describe('FirstLoginSetupPasswordPage', () => {
  beforeEach(() => {
    mockSetupPassword.mockReset()
    window.sessionStorage.clear()
    saveFirstLoginFlowState({ email: 'ali.khan@devexcelit.com', setupToken: 'setup-token-abc' })
  })

  it('keeps all three fields', () => {
    renderPage()

    expect(screen.getByLabelText('Temporary Password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  it('calls the setup-password API with the full contract', async () => {
    mockSetupPassword.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
    renderPage()
    fill()
    submit()

    await waitFor(() => {
      expect(mockSetupPassword).toHaveBeenCalledWith({
        setupToken: 'setup-token-abc',
        temporaryPassword: 'Temp@1234',
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    })
  })

  it('shows the success popup once the backend confirms', async () => {
    mockSetupPassword.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
    renderPage()
    fill()
    submit()

    expect(await screen.findByText('Password Set Successfully!')).toBeInTheDocument()
  })

  it('surfaces the backend error instead of the popup', async () => {
    mockSetupPassword.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ data: { message: 'Temporary password is incorrect' } }),
    })
    renderPage()
    fill()
    submit()

    expect(await screen.findByText('Temporary password is incorrect')).toBeInTheDocument()
    expect(screen.queryByText('Password Set Successfully!')).not.toBeInTheDocument()
  })

  describe('submitting is never a silent no-op', () => {
    it('names the missing temporary password rather than doing nothing', async () => {
      renderPage()
      fill({ temporary: '' })
      submit()

      expect(
        await screen.findByText('Enter the temporary password from your account email.'),
      ).toBeInTheDocument()
      expect(mockSetupPassword).not.toHaveBeenCalled()
    })

    it('reports a mismatch rather than doing nothing', async () => {
      renderPage()
      fill({ confirm: 'Different1!' })
      submit()

      expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
      expect(mockSetupPassword).not.toHaveBeenCalled()
    })

    it('leaves the button clickable so the message can appear', () => {
      renderPage()

      expect(screen.getByRole('button', { name: 'Set Password' })).toBeEnabled()
    })
  })

  describe('auto-redirect', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('lands on login after 5 seconds', async () => {
      mockSetupPassword.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
      renderPage()
      fill()
      submit()

      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.getByText('Password Set Successfully!')).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(await screen.findByText('Login Route')).toBeInTheDocument()
    })

    it('counts down in the popup so the wait is visible', async () => {
      mockSetupPassword.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
      renderPage()
      fill()
      submit()

      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.getByText(/login in 5s/i)).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(2000)
      })
      expect(screen.getByText(/login in 3s/i)).toBeInTheDocument()
    })
  })
})
