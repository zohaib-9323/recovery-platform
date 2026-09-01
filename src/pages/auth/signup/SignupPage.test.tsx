import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SignupPage } from './SignupPage'

const mockRegister = jest.fn()

// jsdom's hostname is always "localhost", which correctly resolves to no
// tenant — so the white-label path has to be driven through this helper.
const mockExtractSubdomain = jest.fn<string | null, [string, string?]>(() => null)

jest.mock('@/lib/tenantTheme', () => ({
  ...jest.requireActual('@/lib/tenantTheme'),
  extractSubdomainFromHostname: (host: string, mainSiteUrl?: string) =>
    mockExtractSubdomain(host, mainSiteUrl),
}))

jest.mock('@/app/services/recoveryApi', () => ({
  useRegisterMutation: () => [mockRegister, { isLoading: false }],
}))

// SignupTermsModal gates its own accept button behind a scroll-to-bottom
// check that isn't meaningful to simulate in jsdom — stand in with a single
// button so the terms-acceptance step itself (covered by the modal's own
// tests) doesn't block exercising the register-wiring this test is about.
jest.mock('@/pages/auth/signup/SignupTermsModal', () => ({
  SignupTermsModal: ({ open, onAccept }: { open: boolean; onAccept: () => void }) =>
    open ? (
      <button type="button" onClick={onAccept}>
        Accept Terms
      </button>
    ) : null,
}))

function makeTestStore() {
  return configureStore({
    reducer: (state = { tenantTheme: { tenant: null } }) => state,
  })
}

function renderSignup() {
  return render(
    <Provider store={makeTestStore()}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/first-login/verify-otp" element={<p>Verify OTP Route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

/**
 * The full field set the signup form collects. Every field here is sent to
 * the register endpoint — the company address block this form used to require
 * was removed because `RegisterRecoveryUserDto` cannot accept it.
 */
function fillValidForm() {
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'jane@acmecorp.com' },
  })
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '5551234567' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'TradeHarmony1!' } })
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: 'TradeHarmony1!' },
  })
  fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Acme Corp' } })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Accept Terms' }))
}

describe('SignupPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
    mockExtractSubdomain.mockReset()
    mockExtractSubdomain.mockReturnValue(null)
  })

  it('calls the real register mutation (not a mock) with the collected fields', async () => {
    mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

    renderSignup()
    fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

    expect(await screen.findByText('Verify OTP Route')).toBeInTheDocument()
    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@acmecorp.com',
        companyName: 'Acme Corp',
        termsAccepted: true,
      }),
    )
  })

  it('sends only fields the register endpoint accepts', () => {
    mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

    renderSignup()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

    // Regression guard: the form used to require a company address block and
    // then drop it, because the endpoint has no property for any of it.
    const body = mockRegister.mock.calls[0][0]
    expect(Object.keys(body).sort()).toEqual(
      [
        'companyName',
        'email',
        'firstName',
        'lastName',
        'password',
        'phone',
        'termsAccepted',
      ].sort(),
    )
  })

  it('sends the phone number with its dial code, like trade-harmonizer does', () => {
    mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

    renderSignup()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

    // The dial code used to be collected and then dropped, storing every
    // Recovery signup's number with no country code.
    expect(mockRegister.mock.calls[0][0].phone).toMatch(/5551234567$/)
  })

  it('sends the tenant when signing up on a white-label subdomain', () => {
    mockExtractSubdomain.mockReturnValue('acme-recovery')
    mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

    renderSignup()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

    // Without this the account is never linked to the tenant and
    // RecoveryTenant.userCount never increments.
    expect(mockRegister.mock.calls[0][0].tenant).toBe('acme-recovery')
  })

  it('omits tenant entirely on the main domain', () => {
    mockExtractSubdomain.mockReturnValue(null)
    mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

    renderSignup()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

    // Sending tenant: undefined would fail the DTO's @IsString on some clients.
    expect('tenant' in mockRegister.mock.calls[0][0]).toBe(false)
  })

  it('does not navigate when registration fails', async () => {
    mockRegister.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ data: { message: 'Email already registered' } }),
    })

    renderSignup()
    fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

    await Promise.resolve()
    expect(screen.queryByText('Verify OTP Route')).not.toBeInTheDocument()
  })
})
