import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ManageUsersPage } from './ManageUsersPage'

const mockListCompanyUsers = jest.fn()
const mockUpdateStatus = jest.fn()
const mockInvite = jest.fn()
const mockCreate = jest.fn()

jest.mock('@/app/services/recoveryCompanyUsersApi', () => ({
  useListCompanyUsersQuery: (...args: unknown[]) => mockListCompanyUsers(...args),
  useUpdateCompanyUserStatusMutation: () => [mockUpdateStatus, { isLoading: false }],
  useInviteCompanyUserMutation: () => [mockInvite, { isLoading: false }],
  useCreateCompanyUserMutation: () => [mockCreate, { isLoading: false }],
}))

function renderPage(role: string) {
  const store = configureStore({
    reducer: (state = { auth: { user: { id: '1', email: 'owner@acmecorp.com', role } } }) => state,
  })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/users" element={<ManageUsersPage />} />
          <Route path="/dashboard" element={<p>Dashboard Route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('ManageUsersPage', () => {
  beforeEach(() => {
    mockListCompanyUsers.mockReset()
    mockListCompanyUsers.mockReturnValue({
      data: {
        content: {
          users: [
            {
              _id: '1',
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@acmecorp.com',
              status: 'active',
              role: 'recovery_company_user',
              joiningDate: '2026-03-01T00:00:00.000Z',
              profilePic: '',
            },
          ],
          pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        },
      },
      isFetching: false,
    })
  })

  it('redirects a company user away from this owner-only page', () => {
    renderPage('recovery_company_user')
    expect(screen.getByText('Dashboard Route')).toBeInTheDocument()
  })

  it("renders the company owner's user list", () => {
    renderPage('recovery_company_owner')
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@acmecorp.com')).toBeInTheDocument()
  })

  it('shows the shared loader instead of the list while fetching', () => {
    mockListCompanyUsers.mockReturnValue({ data: undefined, isFetching: true })
    const { container } = renderPage('recovery_company_owner')

    expect(container.querySelector('.customLoader')).toBeInTheDocument()
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('No users available')).not.toBeInTheDocument()
  })
})
