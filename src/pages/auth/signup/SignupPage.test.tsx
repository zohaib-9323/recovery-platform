import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SignupPage } from './SignupPage'

const mockRegister = jest.fn()
const mockVerifySignupOtp = jest.fn()
const mockVerifyFirstLoginOtp = jest.fn()
const mockRequestFirstLoginOtp = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useRegisterMutation: () => [mockRegister, { isLoading: false }],
  useVerifySignupOtpMutation: () => [mockVerifySignupOtp, { isLoading: false }],
  useVerifyFirstLoginOtpMutation: () => [mockVerifyFirstLoginOtp, { isLoading: false }],
  useRequestFirstLoginOtpMutation: () => [mockRequestFirstLoginOtp, { isLoading: false }],
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

/** Every field the form collects. All of them are sent to the register endpoint. */
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
  fireEvent.change(screen.getByLabelText('Company Phone'), { target: { value: '5559876543' } })
  fireEvent.click(screen.getByRole('checkbox'))
  acceptTerms()
}

function acceptTerms() {
  // The terms modal gates its accept checkbox behind scrolling the legal text
  // to the bottom, which jsdom cannot measure — drive the scroll handler with
  // dimensions that satisfy the check.
  const panel = document.querySelector('[role="dialog"] .overflow-y-auto') as HTMLElement
  Object.defineProperty(panel, 'scrollTop', { value: 1000, configurable: true })
  Object.defineProperty(panel, 'clientHeight', { value: 500, configurable: true })
  Object.defineProperty(panel, 'scrollHeight', { value: 1400, configurable: true })
  fireEvent.scroll(panel)
  fireEvent.click(screen.getByLabelText(/I have read/i))
}

describe('SignupPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
    mockVerifySignupOtp.mockReset()
    mockVerifyFirstLoginOtp.mockReset()
    mockRequestFirstLoginOtp.mockReset()
    sessionStorage.clear()
  })

  describe('structure — these two rules are what keep the form from jumping', () => {
    it('owns no scroll container of its own', () => {
      const { container } = renderSignup()

      // AuthLayout's signup shell has the single scroller, matching
      // trade-harmonizer. A second one here previously split the scrolling
      // between two elements and put the top of the form out of reach.
      const scrollers = container.querySelectorAll(
        '.overflow-y-auto, .overflow-auto, .overflow-y-scroll',
      )
      expect(scrollers).toHaveLength(0)
    })

    it('renders the terms modal outside its own DOM subtree', () => {
      const { container } = renderSignup()

      fireEvent.click(screen.getByRole('button', { name: 'Terms' }))

      // Portalled to document.body. Inline, the overlay is a child of whatever
      // scrolls this page, and mounting it moved that scroll position.
      const dialog = screen.getByRole('dialog')
      expect(container.contains(dialog)).toBe(false)
      expect(document.body.contains(dialog)).toBe(true)
    })

    it('does not freeze or otherwise touch document.body when the modal opens', () => {
      const before = document.body.style.overflow
      renderSignup()

      fireEvent.click(screen.getByRole('button', { name: 'Terms' }))

      // An earlier fix locked document.body, which never scrolls under the auth
      // shell — it achieved nothing and reset scroll positions as a side effect.
      expect(document.body.style.overflow).toBe(before)
    })
  })

  describe('claimed company domain', () => {
    const reject409 = (message: string) => ({
      unwrap: jest.fn().mockRejectedValue({ status: 409, data: { message } }),
    })

    it('pins the server conflict under the email field so it outlives the toast', async () => {
      // The backend rejects a second signup on an already-claimed company
      // domain. The instruction it returns is the whole recovery path for the
      // user, so it must not vanish with the toast.
      mockRegister.mockReturnValue(
        reject409(
          'An account already exists for this company domain. Please ask your company owner to invite you.',
        ),
      )

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      expect(await screen.findByText(/ask your company owner to invite you/i)).toBeInTheDocument()
    })

    it('stays on the form rather than advancing to OTP', async () => {
      mockRegister.mockReturnValue(reject409('This company domain is already registered.'))

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      expect(await screen.findByText(/already registered/i)).toBeInTheDocument()
      expect(screen.queryAllByLabelText(/code \d/i)).toHaveLength(0)
    })

    it('clears the conflict once the email is edited', async () => {
      mockRegister.mockReturnValue(reject409('This company domain is already registered.'))

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))
      expect(await screen.findByText(/already registered/i)).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText(/^email/i), {
        target: { value: 'someone@othercorp.com' },
      })

      expect(screen.queryByText(/already registered/i)).not.toBeInTheDocument()
    })
  })

  describe('submission', () => {
    it('calls the register mutation with the collected fields', async () => {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      // The OTP step now renders in place on the same /signup screen instead
      // of navigating to /first-login/verify-otp.
      expect(await screen.findAllByLabelText(/code \d/i)).toHaveLength(6)
      expect(screen.queryByText('Verify OTP Route')).not.toBeInTheDocument()
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

    it('sends every Company Details field the form collects', async () => {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))
      await screen.findAllByLabelText(/code \d/i)

      // These were once collected, required, and then dropped, because
      // RegisterRecoveryUserDto had no property for any of them.
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          companyEmail: 'jane@acmecorp.com',
          address1: '1 Main St',
          country: 'United Kingdom',
          city: 'London',
          postalCode: 'SW1A 1AA',
        }),
      )
      expect(mockRegister.mock.calls[0][0].companyPhone).toMatch(/5559876543$/)
    })

    it('sends the phone number with its dial code, like trade-harmonizer does', async () => {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))
      await screen.findAllByLabelText(/code \d/i)

      expect(mockRegister.mock.calls[0][0].phone).toMatch(/5551234567$/)
    })

    it('does not advance to the OTP step when registration fails', async () => {
      mockRegister.mockReturnValue({
        unwrap: jest.fn().mockRejectedValue({ data: { message: 'Email already registered' } }),
      })

      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      await Promise.resolve()
      expect(screen.queryByLabelText(/code \d/i)).not.toBeInTheDocument()
      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    })
  })

  describe('optional address fields', () => {
    it('submits with postal code, country and city all left empty', async () => {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

      renderSignup()
      fillValidForm()
      fireEvent.change(screen.getByLabelText('Country'), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText('City'), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      expect(await screen.findAllByLabelText(/code \d/i)).toHaveLength(6)
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ country: '', city: '', postalCode: '' }),
      )
    })

    it('submits with a country and city but no postal code', async () => {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

      renderSignup()
      fillValidForm()
      fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      expect(await screen.findAllByLabelText(/code \d/i)).toHaveLength(6)
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'United Kingdom', city: 'London', postalCode: '' }),
      )
    })

    it('requires a city once a country has been picked', async () => {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })

      renderSignup()
      fillValidForm()
      fireEvent.change(screen.getByLabelText('City'), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))

      await Promise.resolve()
      expect(mockRegister).not.toHaveBeenCalled()
      expect(screen.getByText('This field is required.')).toBeInTheDocument()
    })
  })

  describe('email-verification step', () => {
    beforeEach(() => {
      jest.useFakeTimers({ advanceTimers: true })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    async function registerAndReachOtpStep() {
      mockRegister.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
      renderSignup()
      fillValidForm()
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }))
      await screen.findAllByLabelText(/code \d/i)
    }

    it('renders the OTP step in place, without navigating away from /signup', async () => {
      await registerAndReachOtpStep()

      // No separate route for the OTP step — the signup form's fields are
      // gone and the OTP digit grid takes their place on the same screen.
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument()
      expect(screen.getAllByLabelText(/code \d/i)).toHaveLength(6)
    })

    it('verifies via verifySignupOtp and shows the success popup', async () => {
      mockVerifySignupOtp.mockReturnValue({ unwrap: jest.fn().mockResolvedValue({ status: true }) })
      await registerAndReachOtpStep()

      const digitInputs = screen.getAllByLabelText(/code \d/i)
      '123456'.split('').forEach((digit, i) => {
        fireEvent.change(digitInputs[i], { target: { value: digit } })
      })
      fireEvent.click(screen.getByRole('button', { name: /verify/i }))

      expect(await screen.findByText('Email Verified Successfully!')).toBeInTheDocument()
      expect(mockVerifySignupOtp).toHaveBeenCalledWith({
        email: 'jane@acmecorp.com',
        otp: '123456',
      })
    })

    it('restart signup returns to the personal-info step', async () => {
      await registerAndReachOtpStep()

      // The restart link only appears once the resend countdown expires.
      act(() => {
        jest.advanceTimersByTime(300_000)
      })

      fireEvent.click(screen.getByRole('button', { name: 'Restart signup' }))

      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.queryByLabelText(/code \d/i)).not.toBeInTheDocument()
    })
  })
})
