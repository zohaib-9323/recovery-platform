import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { AppSidebar } from './app-sidebar'

/** Covers the one role-gated nav item ("Manage Users") added for the
 * owner-invite feature — every other item stays visible to any authenticated
 * user, unchanged. */

function renderSidebar(role: string | undefined) {
  const store = configureStore({
    reducer: (
      state = {
        auth: { user: role ? { id: '1', email: 'a@b.com', role } : null },
        sideBar: { sideBarExpanded: true },
      },
    ) => state,
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    </Provider>,
  )
}

describe('AppSidebar', () => {
  it('hides Manage Users from a company user', () => {
    renderSidebar('recovery_company_user')
    expect(screen.queryByText('Manage Users')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows Manage Users to a company owner', () => {
    renderSidebar('recovery_company_owner')
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
  })

  it('hides Manage Users when role is not yet known (e.g. still loading)', () => {
    renderSidebar(undefined)
    expect(screen.queryByText('Manage Users')).not.toBeInTheDocument()
  })
})
