import { render, screen } from '@testing-library/react'

import { CompanyConnectionDetailCard } from './company-connection-detail-card'

/**
 * The owner-side connection detail screen — the destination the Connections
 * table's eye icon had no route to until now.
 *
 * What is worth pinning here is the difference from the admin twin it mirrors:
 * the query is keyed by userId (scoping is enforced server-side, so a wrong id
 * must surface as "not found" rather than someone else's data), a failed
 * request must not read as an empty result, and a lapsed connection has to say
 * what the owner should do about it — they cannot reconnect another person's
 * mailbox themselves.
 */

const mockDetailQuery = jest.fn()

jest.mock('@/app/services/recoveryCompanyUsersApi', () => ({
  useGetCompanyConnectionDetailQuery: (...args: unknown[]) => mockDetailQuery(...args),
}))

const CONNECTED = {
  recoveryUserId: 'u1',
  firstName: 'Ahmad',
  lastName: 'Asif',
  email: 'ahmad.asif@devexcelit.com',
  tenantId: null,
  tenantName: null,
  connection: {
    id: 'c1',
    connectedAccount: 'ahmad.asif@devexcelit.com',
    connectionStatus: 'connected' as const,
    connectedSince: '2026-06-12T08:00:00.000Z',
    lastSync: '2026-08-18T09:15:00.000Z',
    tokenExpiry: '2026-08-18T10:15:00.000Z',
    lastError: null,
  },
  importJobs: {
    items: [
      {
        id: 'job-1',
        status: 'completed' as const,
        mailboxEmail: 'ahmad.asif@devexcelit.com',
        folderName: 'Inbox',
        folders: [{ folderId: 'f1', folderName: 'Inbox' }],
        dateRangeStart: '2026-01-01T00:00:00.000Z',
        dateRangeEnd: '2026-03-31T23:59:59.999Z',
        stats: {
          totalDiscovered: 420,
          scanned: 420,
          matched: 310,
          unmatched: 16,
          added: 748,
          skipped: 12,
          failed: 3,
        },
        jobRetryCount: 0,
        fatalError: null,
        startedAt: '2026-04-01T10:35:00.000Z',
        completedAt: '2026-04-01T10:47:23.000Z',
        createdAt: '2026-04-01T10:34:58.000Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 6,
    totalPages: 1,
  },
}

const success = (content: unknown) => ({
  data: { content },
  isFetching: false,
  isError: false,
  refetch: jest.fn(),
})

beforeEach(() => {
  mockDetailQuery.mockReset()
})

describe('CompanyConnectionDetailCard', () => {
  it('asks for the user in the URL, so the id cannot be dropped and land on the caller', () => {
    mockDetailQuery.mockReturnValue(success(CONNECTED))

    render(<CompanyConnectionDetailCard userId="u1" />)

    expect(mockDetailQuery).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
      expect.anything(),
    )
  })

  it('shows the connection health an owner needs to chase a lapse', () => {
    mockDetailQuery.mockReturnValue(success(CONNECTED))

    render(<CompanyConnectionDetailCard userId="u1" />)

    // Twice: once as the login email, once as the connected mailbox. They
    // match here, which is the common case and the one that would hide a bug
    // where only one of the two fields renders.
    expect(screen.getAllByText('ahmad.asif@devexcelit.com')).toHaveLength(2)
    expect(screen.getByText('Connected')).toBeInTheDocument()
    // Token expiry is a timestamp, never a token — it is what makes "Auth
    // Expired" actionable rather than just descriptive.
    expect(screen.getByText('Token Expiry')).toBeInTheDocument()
  })

  it('renders the import job history with its per-job counts', () => {
    mockDetailQuery.mockReturnValue(success(CONNECTED))

    render(<CompanyConnectionDetailCard userId="u1" />)

    expect(screen.getByText('Inbox')).toBeInTheDocument()
    expect(screen.getByText('420')).toBeInTheDocument()
    expect(screen.getByText('748')).toBeInTheDocument()
  })

  it('tells the owner what to do when the mailbox needs reconnecting', () => {
    // An owner cannot reconnect someone else's mailbox, so the status pill on
    // its own leaves them with no next step.
    mockDetailQuery.mockReturnValue(
      success({
        ...CONNECTED,
        connection: {
          ...CONNECTED.connection,
          connectionStatus: 'auth_expired' as const,
          lastError: 'AADSTS70008: refresh token expired',
        },
      }),
    )

    render(<CompanyConnectionDetailCard userId="u1" />)

    expect(screen.getByText('Auth Expired')).toBeInTheDocument()
    expect(screen.getByText(/ask them to reconnect/i)).toBeInTheDocument()
    expect(screen.getByText('AADSTS70008: refresh token expired')).toBeInTheDocument()
  })

  it('reports a failed request instead of "connection not found"', () => {
    // The two states look identical to a user but mean opposite things: one is
    // a fault to retry, the other says the user genuinely is not there.
    mockDetailQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: true,
      refetch: jest.fn(),
    })

    render(<CompanyConnectionDetailCard userId="u1" />)

    expect(screen.getByText(/could not load this connection/i)).toBeInTheDocument()
    expect(screen.queryByText('Connection not found.')).not.toBeInTheDocument()
  })

  it('reports not-found for a user outside the company, which the API answers with a null body', () => {
    // Scoping is server-side: a hand-edited id from another company comes back
    // 404 with content: null rather than that user's data.
    mockDetailQuery.mockReturnValue(success(null))

    render(<CompanyConnectionDetailCard userId="someone-elses-id" />)

    expect(screen.getByText('Connection not found.')).toBeInTheDocument()
  })

  it('says so plainly when the user has never run an import', () => {
    mockDetailQuery.mockReturnValue(
      success({
        ...CONNECTED,
        importJobs: { items: [], total: 0, page: 1, limit: 6, totalPages: 0 },
      }),
    )

    render(<CompanyConnectionDetailCard userId="u1" />)

    expect(screen.getByText('No import jobs found for this user.')).toBeInTheDocument()
  })
})
