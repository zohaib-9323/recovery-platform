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
