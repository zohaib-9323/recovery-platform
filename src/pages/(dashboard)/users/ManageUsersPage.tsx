import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CsvExportButton } from '@/components/buttons'
import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { manageUsersRows, type ManageUserRow } from '@/data/mock/manage-users'
import { MU } from '@/lib/manage-users-copy'
import type { UserStatusFilter } from '@/lib/manage-users-table-helper'
import { showCustomToast } from '@/lib/showCustomToast'

import { CreateUserModal } from './components/create-user-modal'
import { InviteUserModal } from './components/invite-user-modal'
import { ManageUsersTable } from './components/manage-users-table'
import { ManageUsersToolbar } from './components/manage-users-toolbar'
import type { UserRowAction } from './components/user-row-action-menu'
import { UserStatusConfirmModal } from './components/user-status-confirm-modal'

const PAGE_SIZE = 10

type UserListCsvRow = {
  Name: string
  JoiningDate: string
  Email: string
  Status: string
}

export function ManageUsersPage() {
  const navigate = useNavigate()

  const [users, setUsers] = useState<ManageUserRow[]>(manageUsersRows)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [csvData, setCsvData] = useState<UserListCsvRow[]>([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showInviteUser, setShowInviteUser] = useState(false)
  const [pendingStatusUser, setPendingStatusUser] = useState<ManageUserRow | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    return users.filter((user) => {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      if (!matchesStatus) {
        return false
      }
      if (!term) {
        return true
      }
      const haystack = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [users, debouncedSearch, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const pageRows = useMemo(
    () => filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredUsers, safePage],
  )

  const isAllSelected = pageRows.length > 0 && pageRows.every((r) => selectedUserIds.includes(r.id))

  const handleSelectAll = useCallback(() => {
    setSelectedUserIds((prev) => {
      const pageIds = pageRows.map((row) => row.id)
      const everySelected = pageIds.length > 0 && pageIds.every((id) => prev.includes(id))
      if (everySelected) {
        return prev.filter((id) => !pageIds.includes(id))
      }
      return Array.from(new Set([...prev, ...pageIds]))
    })
  }, [pageRows])

  const handleSelect = useCallback((id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id],
    )
  }, [])

  const generateCsv = useCallback(() => {
    setCsvData(
      filteredUsers
        .filter((user) => selectedUserIds.includes(user.id))
        .map((user) => ({
          Name: `${user.firstName} ${user.lastName}`,
          JoiningDate: user.joiningDate,
          Email: user.email,
          Status: user.status,
        })),
    )
  }, [filteredUsers, selectedUserIds])

  const handleRowAction = useCallback(
    (action: UserRowAction, user: ManageUserRow) => {
      if (action === 'details') {
        navigate(`/users/${user.id}`)
        return
      }
      setPendingStatusUser(user)
    },
    [navigate],
  )

  const applyStatusChange = useCallback(() => {
    if (!pendingStatusUser) {
      return
    }
    const nextStatus = pendingStatusUser.status === 'active' ? 'suspended' : 'active'
    setUsers((prev) =>
      prev.map((user) =>
        user.id === pendingStatusUser.id ? { ...user, status: nextStatus } : user,
      ),
    )
    setPendingStatusUser(null)
    showCustomToast({
      type: 'success',
      title: 'Success',
      message:
        nextStatus === 'suspended'
          ? 'User has been suspended.'
          : 'User has been reactivated successfully.',
    })
  }, [pendingStatusUser])

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 bg-white p-3 sm:p-5">
        <ManageUsersToolbar
          search={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value)
            setCurrentPage(1)
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
            setSelectedUserIds([])
          }}
          onCreateUser={() => setShowCreateUser(true)}
          onInviteUser={() => setShowInviteUser(true)}
        />

        {pageRows.length > 0 ? (
          <div className="flex min-h-0 w-full flex-1 flex-col gap-3 rounded-lg border border-bottomBorder p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <CustomCheckboxShipment
                  width="min-w-6"
                  height="h-6"
                  iconSize="text-[10px]"
                  isChecked={isAllSelected}
                  onChange={handleSelectAll}
                />
                <span className="text-normal font-light text-black">{MU.selectAll}</span>
              </div>
              <CsvExportButton
                isDisabled={selectedUserIds.length === 0}
                data={csvData}
                moduleName="Manage-Users(Recovery)"
                buttonText={MU.exportCSV}
                className="export-btn"
                onClick={generateCsv}
              />
            </div>

            <ManageUsersTable
              data={pageRows}
              selectedUserIds={selectedUserIds}
              onCheckChange={handleSelect}
              onRowAction={handleRowAction}
            />

            {totalPages > 1 ? (
              <CustomPagination
                totalPages={totalPages}
                currentPage={safePage}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4">
            <div className="flex w-full max-w-lg flex-col items-center justify-center gap-5">
              <img src="/images/emptybox.svg" alt="" width={200} height={200} />
              <p className="text-center text-lg font-light text-black">{MU.noUsersAvailable}</p>
            </div>
          </div>
        )}
      </div>

      <CreateUserModal
        open={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onSubmit={() =>
          showCustomToast({
            type: 'success',
            title: 'Success',
            message: 'User created and notified successfully.',
          })
        }
      />

      <InviteUserModal
        open={showInviteUser}
        onClose={() => setShowInviteUser(false)}
        onSubmit={() =>
          showCustomToast({
            type: 'success',
            title: 'Success',
            message: 'Invitation sent successfully.',
          })
        }
      />

      {pendingStatusUser ? (
        <UserStatusConfirmModal
          open
          intent={pendingStatusUser.status === 'active' ? 'suspend' : 'reactivate'}
          userName={`${pendingStatusUser.firstName} ${pendingStatusUser.lastName}`}
          onConfirm={applyStatusChange}
          onClose={() => setPendingStatusUser(null)}
        />
      ) : null}
    </>
  )
}
