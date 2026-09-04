import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { AppSidebar } from './app-sidebar'

/**
 * Covers the expandable "Imports" group. The open/closed rule is the fiddly part:
 * the active route only supplies a DEFAULT, and gating open-ness on it instead
 * made the menu impossible to open from anywhere outside /imports.
 *
 * Also covers the one role-gated nav item ("Manage Users") added for the
 * owner-invite feature — every other item stays visible to any authenticated
 * user, unchanged.
 */

function renderSidebar(path: string, sideBarExpanded = true, role?: string) {
  const store = configureStore({
    reducer: (
      state = {
        auth: { user: role ? { id: '1', email: 'a@b.com', role } : null },
        sideBar: { sideBarExpanded },
      },
    ) => state,
  })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppSidebar />
      </MemoryRouter>
    </Provider>,
  )
}

const importsToggle = () => screen.getByRole('button', { name: /Imports/ })

describe('AppSidebar — Imports group', () => {
  it('opens when clicked from a route outside the group', () => {
    renderSidebar('/dashboard')

    expect(screen.queryByRole('button', { name: 'Import Jobs' })).not.toBeInTheDocument()

    fireEvent.click(importsToggle())

    expect(screen.getByRole('button', { name: 'Import Jobs' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processable Shipments' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unprocessed Documents' })).toBeInTheDocument()
  })

  it('is open by default when already inside the group', () => {
    renderSidebar('/imports')

    expect(screen.getByRole('button', { name: 'Import Jobs' })).toBeInTheDocument()
    expect(importsToggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes again on a second click', () => {
    renderSidebar('/imports')

    fireEvent.click(importsToggle())

    expect(screen.queryByRole('button', { name: 'Import Jobs' })).not.toBeInTheDocument()
    expect(importsToggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks only the deepest matching child active', () => {
    // "Import Jobs" links to /imports, a prefix of every sibling — plain prefix
    // matching would light it up here too.
    renderSidebar('/imports/processable-shipments')

    expect(screen.getByRole('button', { name: 'Processable Shipments' })).toHaveClass('text-yellow')
    expect(screen.getByRole('button', { name: 'Import Jobs' })).not.toHaveClass('text-yellow')
  })

  it('keeps Import Jobs active on an import detail route no sibling claims', () => {
    renderSidebar('/imports/6a8e76ab6b78bfc0424c8641')

    expect(screen.getByRole('button', { name: 'Import Jobs' })).toHaveClass('text-yellow')
  })

  it('shows children in a hover popover on the collapsed rail and navigates on click', () => {
    // The rail has no room for an accordion toggle (no aria-expanded button),
    // but the sub-routes are still in the DOM as a CSS-only hover popover —
    // as divs, not buttons, matching the single-link flyout's existing
    // pattern — matching admin's collapsed-rail behavior.
    renderSidebar('/dashboard', false)

    expect(document.querySelector('[aria-expanded]')).toBeNull()
    const target = screen.getByText('Processable Shipments')
    expect(target).toBeInTheDocument()

    fireEvent.click(target)

    expect(screen.getByText('Processable Shipments')).toHaveClass('text-yellow')
  })
})

describe('AppSidebar — role-gated items', () => {
  it('hides Manage Users from a company user', () => {
    renderSidebar('/dashboard', true, 'recovery_company_user')

    expect(screen.queryByText('Manage Users')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows Manage Users to a company owner', () => {
    renderSidebar('/dashboard', true, 'recovery_company_owner')

    expect(screen.getByText('Manage Users')).toBeInTheDocument()
  })

  it('hides Manage Users when role is not yet known (e.g. still loading)', () => {
    renderSidebar('/dashboard')

    expect(screen.queryByText('Manage Users')).not.toBeInTheDocument()
  })
})
