import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { ManageUserRow } from '@/data/mock/manage-users'

import { ManageUsersTable } from './manage-users-table'

/**
 * Covers the Figma row-action rules: an active user can be suspended, a
 * suspended user can be reactivated, and both can be opened for details.
 */

const ACTIVE_USER: ManageUserRow = {
  id: '1',
  firstName: 'Jon',
  lastName: 'Haley',
  email: 'Mike17@gmail.com',
  joiningDate: '13/03/2025',
  status: 'active',
}

const SUSPENDED_USER: ManageUserRow = {
  id: '2',
  firstName: 'Ruth',
  lastName: 'Convey',
  email: 'Ruthie58@yahoo.com',
  joiningDate: '25/02/2025',
  status: 'suspended',
}

function renderTable(overrides: Partial<React.ComponentProps<typeof ManageUsersTable>> = {}) {
  const onRowAction = jest.fn()
  const onCheckChange = jest.fn()
  render(
    <MemoryRouter>
      <ManageUsersTable
        data={[ACTIVE_USER, SUSPENDED_USER]}
        selectedUserIds={[]}
        onCheckChange={onCheckChange}
        onRowAction={onRowAction}
        {...overrides}
      />
    </MemoryRouter>,
  )
  return { onRowAction, onCheckChange }
}

function openRowMenu(name: string) {
  const row = screen.getByText(name).closest('tr')!
  fireEvent.click(row.querySelector('button[aria-haspopup="menu"]')!)
}

describe('ManageUsersTable', () => {
  it('renders a row per user with its status tag', () => {
    renderTable()

    expect(screen.getByText('Jon Haley')).toBeInTheDocument()
    expect(screen.getByText('Mike17@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('suspended')).toBeInTheDocument()
  })

  it('offers Suspend User for an active row and reports the action', () => {
    const { onRowAction } = renderTable()

    openRowMenu('Jon Haley')
    expect(screen.queryByText('Reactivate User')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Suspend User'))

    expect(onRowAction).toHaveBeenCalledWith('suspend', ACTIVE_USER)
  })

  it('offers Reactivate User for a suspended row', () => {
    const { onRowAction } = renderTable()

    openRowMenu('Ruth Convey')
    expect(screen.queryByText('Suspend User')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Reactivate User'))

    expect(onRowAction).toHaveBeenCalledWith('reactivate', SUSPENDED_USER)
  })

  it('reports the details action from the row menu', () => {
    const { onRowAction } = renderTable()

    openRowMenu('Jon Haley')
    fireEvent.click(screen.getByText('View User Details'))

    expect(onRowAction).toHaveBeenCalledWith('details', ACTIVE_USER)
  })

  it('toggles selection through the row checkbox', () => {
    const { onCheckChange } = renderTable()

    const row = screen.getByText('Jon Haley').closest('tr')!
    fireEvent.click(row.querySelector('input[type="checkbox"]')!)

    expect(onCheckChange).toHaveBeenCalledWith('1')
  })
})
