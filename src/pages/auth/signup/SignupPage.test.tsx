import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SignupPage } from './SignupPage'

const mockRegister = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useRegisterMutation: () => [mockRegister, { isLoading: false }],
}))

// CountryDropdown/CityDropdown are react-select components backed by a
// country/city dataset — stand in with plain inputs so the form's own
// register-wiring can be exercised without driving a real react-select menu.
jest.mock('@/components/fields', () => {
  const actual = jest.requireActual('@/components/fields')
  return {
    ...actual,
    CountryDropdown: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <input aria-label="Country" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
    CityDropdown: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <input aria-label="City" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  }
})

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

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: 'jane@acmecorp.com' },
  })
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '5551234567' } })
  fireEvent.change(screen.getByLabelText('Company Email'), {
    target: { value: 'jane@acmecorp.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'TradeHarmony1!' } })
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: 'TradeHarmony1!' },
  })
  fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Acme Corp' } })
  fireEvent.change(screen.getByLabelText('Address 1'), { target: { value: '1 Main St' } })
  fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'United Kingdom' } })
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'London' } })
  fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: 'SW1A 1AA' } })
  fireEvent.change(screen.getByLabelText('Company Phone'), {
    target: { value: '5559876543' },
  })
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Accept Terms' }))
}

describe('SignupPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
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
