import { readFileSync } from 'fs'

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { CompanyConnectionsCard } from './company-connections-card'
import { CompanyDeleteRequestsCard } from './company-delete-requests-card'

/**
 * Both owner-only cards, and the failure mode that made one of them look empty
 * in production: the request 404'd (a missing `/recovery` prefix) and the card
 * rendered its "nothing here" state, which is indistinguishable from a company
 * with no team members.
 */
const mockConnections = jest.fn()
const mockDeleteRequests = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

/** The card routes on the eye icon, so it only renders inside a router. */
const renderConnections = () =>
  render(
    <MemoryRouter>
      <CompanyConnectionsCard />
    </MemoryRouter>,
  )

jest.mock('@/app/services/recoveryCompanyUsersApi', () => ({
  useListCompanyM365StatusQuery: () => mockConnections(),
  useListCompanyDeleteRequestsQuery: () => mockDeleteRequests(),
  useDecideCompanyDeleteRequestMutation: () => [jest.fn(), { isLoading: false }],
}))

describe('CompanyConnectionsCard', () => {
  beforeEach(() => {
    mockConnections.mockReset()
    mockNavigate.mockReset()
    mockDeleteRequests.mockReset().mockReturnValue({ data: undefined, isLoading: false })
  })

  it('lists every teammate, including one who has never connected', () => {
    mockConnections.mockReturnValue({
      data: {
        content: {
          items: [
            {
              recoveryUserId: 'u1',
              userName: 'Ahmad Asif',
              userEmail: 'ahmad.asif@devexcelit.com',
              connectedAccount: 'ahmad.asif@devexcelit.com',
              connectionStatus: 'connected',
              connectedSince: null,
              lastSync: null,
            },
            {
              recoveryUserId: 'u2',
              userName: 'Never Connected',
              userEmail: 'nobody@devexcelit.com',
              connectedAccount: null,
              connectionStatus: 'not_connected',
              connectedSince: null,
              lastSync: null,
            },
          ],
          total: 2,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderConnections()

    expect(screen.getByText('Ahmad Asif')).toBeInTheDocument()
    // Built from the member list, not the connection list, so someone who has
    // never connected still appears — the state an owner most needs to see.
    expect(screen.getByText('Never Connected')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('Not Connected')).toBeInTheDocument()
  })

  it('reports a failed request instead of showing an empty team', () => {
    mockConnections.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })

    renderConnections()

    expect(screen.getByText(/could not load connection status/i)).toBeInTheDocument()
    expect(screen.queryByText('No team members yet.')).not.toBeInTheDocument()
  })

  it('opens the detail screen for the row that was clicked', () => {
    // The eye icon shipped inert. Two rows are rendered so the assertion is
    // that the SECOND one routes to its own id, not to whichever row is first.
    mockConnections.mockReturnValue({
      data: {
        content: {
          items: [
            {
              recoveryUserId: 'u1',
              userName: 'Ahmad Asif',
              userEmail: 'ahmad.asif@devexcelit.com',
              connectedAccount: 'ahmad.asif@devexcelit.com',
              connectionStatus: 'connected',
              connectedSince: null,
              lastSync: null,
            },
            {
              recoveryUserId: 'u2',
              userName: 'Never Connected',
              userEmail: 'nobody@devexcelit.com',
              connectedAccount: null,
              connectionStatus: 'not_connected',
              connectedSince: null,
              lastSync: null,
            },
          ],
          total: 2,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderConnections()

    const row = screen.getByText('Never Connected').closest('tr')!
    fireEvent.click(row.querySelector('button[aria-label="View connection"]')!)

    expect(mockNavigate).toHaveBeenCalledWith('/users/connections/u2')
  })
})

describe('CompanyDeleteRequestsCard', () => {
  beforeEach(() => {
    mockConnections.mockReset().mockReturnValue({ data: undefined, isLoading: false })
    mockDeleteRequests.mockReset()
  })

  it('reports a failed request instead of an empty queue', () => {
    // An owner silently shown "no requests" would never action a real one.
    mockDeleteRequests.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })

    render(<CompanyDeleteRequestsCard />)

    expect(screen.getByText(/could not load deletion requests/i)).toBeInTheDocument()
    expect(screen.queryByText('No pending deletion requests.')).not.toBeInTheDocument()
  })
})

describe('company endpoints', () => {
  it('calls the M365 company-status route under the /recovery prefix', () => {
    // Read from source rather than the mocked module: every recovery route
    // carries this prefix, and the one that did not simply 404'd with no
    // visible error at the time.
    const source = readFileSync('src/app/services/recoveryCompanyUsersApi.ts', 'utf8')

    expect(source).toContain("'/recovery/m365/company-status'")
    expect(source).toContain('`/recovery/m365/company-status/${userId}`')
    expect(source).toContain("'/recovery/company-users/delete-requests'")
  })
})
