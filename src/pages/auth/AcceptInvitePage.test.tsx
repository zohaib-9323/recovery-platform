import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AcceptInvitePage } from './AcceptInvitePage'

const mockAcceptInvite = jest.fn()
const mockGetInviteDetails = jest.fn()

jest.mock('@/app/services/recoveryCompanyUsersApi', () => ({
  useAcceptInviteMutation: () => [mockAcceptInvite, { isLoading: false }],
  useGetInviteDetailsQuery: (...args: unknown[]) => mockGetInviteDetails(...args),
}))

function makeTestStore() {
  return configureStore({
    reducer: (state = { tenantTheme: { tenant: null } }) => state,
  })
}

function renderWithRoute(path: string) {
  return render(
    <Provider store={makeTestStore()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/login" element={<p>Login Route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('AcceptInvitePage', () => {
  beforeEach(() => {
    mockAcceptInvite.mockReset()
    mockGetInviteDetails.mockReset()
  })

  it('shows a message when the token is missing from the URL', () => {
    mockGetInviteDetails.mockReturnValue({ data: undefined, isLoading: false, error: undefined })
    renderWithRoute('/accept-invite')

    expect(screen.getByText('This invitation link is missing its token.')).toBeInTheDocument()
  })

  it('prefills the invited email/company once the token resolves', () => {
    mockGetInviteDetails.mockReturnValue({
      data: { content: { email: 'jane@acmecorp.com', companyName: 'Acme Corp' } },
      isLoading: false,
      error: undefined,
    })
    renderWithRoute('/accept-invite?token=valid-token')

    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument()
    expect(screen.getByText(/jane@acmecorp.com/)).toBeInTheDocument()
  })

  it('keeps submit disabled until every field (including terms) is satisfied', () => {
    mockGetInviteDetails.mockReturnValue({
      data: { content: { email: 'jane@acmecorp.com', companyName: 'Acme Corp' } },
      isLoading: false,
      error: undefined,
    })

    renderWithRoute('/accept-invite?token=valid-token')

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'TradeHarmony1!' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'TradeHarmony1!' },
    })

    // Terms aren't accepted yet (accepting opens the scroll-gated terms modal,
    // covered separately by SignupTermsModal's own tests) — submit stays disabled.
    expect(screen.getByRole('button', { name: 'Complete registration' })).toBeDisabled()
    expect(mockAcceptInvite).not.toHaveBeenCalled()
  })

  describe('invited-user journey', () => {
    const inviteResolved = () =>
      mockGetInviteDetails.mockReturnValue({
        data: { content: { email: 'jane@acmecorp.com', companyName: 'Acme Corp' } },
        isLoading: false,
        error: undefined,
      })

    it('never asks an invited user for company details', () => {
      // They join the inviting owner's company — collecting company fields
      // here would either be discarded or let them describe a company that
      // isn't theirs.
      inviteResolved()
      renderWithRoute('/accept-invite?token=valid-token')

      expect(screen.queryByLabelText(/company name/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/company website/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/postal code/i)).not.toBeInTheDocument()
      // Company Email lives in signup's Personal Information block, not the
      // Company Details block, so it needs asserting separately.
      expect(screen.queryByLabelText(/company email/i)).not.toBeInTheDocument()
    })

    it('offers the same personal + password fields as signup', () => {
      // The rebuild's whole purpose: an invited user is going through signup,
      // so the form must not drift into a different set of fields.
      inviteResolved()
      renderWithRoute('/accept-invite?token=valid-token')

      expect(screen.getByLabelText('First Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('shows the invited address read-only, since the token fixes it', () => {
      inviteResolved()
      renderWithRoute('/accept-invite?token=valid-token')

      const email = screen.getByLabelText('Email Address') as HTMLInputElement
      expect(email.value).toBe('jane@acmecorp.com')
      expect(email).toBeDisabled()
    })

    it('renders the two-step stepper like signup', () => {
      inviteResolved()
      renderWithRoute('/accept-invite?token=valid-token')

      // "Personal Information" appears twice — the stepper label and the
      // section heading — exactly as it does on the signup page.
      expect(screen.getAllByText('Personal Information').length).toBeGreaterThan(0)
      expect(screen.getByText('Email Verification')).toBeInTheDocument()
    })

    it('offers a phone field that keeps digits only', () => {
      // The dial code is a separate dropdown, so the text input must not
      // accept its own '+' or spacing — the two are concatenated on submit.
      inviteResolved()
      renderWithRoute('/accept-invite?token=valid-token')

      const phone = screen.getByLabelText('Phone Number') as HTMLInputElement
      fireEvent.change(phone, { target: { value: '+1 (555) 123-4567' } })

      expect(phone.value).toBe('15551234567')
    })
  })

  it('surfaces a server error message without crashing', () => {
    mockGetInviteDetails.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { data: { message: 'This invitation has expired.' } },
    })

    renderWithRoute('/accept-invite?token=expired-token')

    expect(screen.getByText('This invitation has expired.')).toBeInTheDocument()
  })
})
