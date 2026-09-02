import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useCreateCompanyUserMutation,
  useInviteCompanyUserMutation,
  useListCompanyUsersQuery,
  useUpdateCompanyUserStatusMutation,
} from '@/app/services/recoveryCompanyUsersApi'
import { useAppSelector } from '@/app/redux-hooks'
import { CsvExportButton } from '@/components/buttons'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import type { ManageUserRow } from '@/data/mock/manage-users'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { MU } from '@/lib/manage-users-copy'
import type { UserStatusFilter } from '@/lib/manage-users-table-helper'
import { showCustomToast } from '@/lib/showCustomToast'
import { RECOVERY_COMPANY_OWNER } from '@/types/roles'

import { CreateUserModal, type CreateUserValues } from './components/create-user-modal'
import { InviteUserModal } from './components/invite-user-modal'
import { ManageUsersTable } from './components/manage-users-table'
import { ManageUsersToolbar } from './components/manage-users-toolbar'
import type { UserRowAction } from './components/user-row-action-menu'
import { UserStatusConfirmModal } from './components/user-status-confirm-modal'
import { toManageUserRow } from './manage-users-mappers'

const PAGE_SIZE = 10

type UserListCsvRow = {
  Name: string
  JoiningDate: string
  Email: string
  Status: string
}

export function ManageUsersPage() {
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.user)

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

  // Owner-only page — a company user landing here (direct link, stale nav state)
  // is bounced to the dashboard, matching the main platform's client-side gating.
  useEffect(() => {
    if (currentUser && currentUser.role !== RECOVERY_COMPANY_OWNER) {
      showCustomToast({
        type: 'error',
        title: MU.notAuthorizedTitle,
        message: MU.notAuthorizedMessage,
      })
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  const { data, isFetching } = useListCompanyUsersQuery(
    {
      search: debouncedSearch.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    },
    {
      skip: !currentUser || currentUser.role !== RECOVERY_COMPANY_OWNER,
      refetchOnMountOrArgChange: true,
    },
  )

  const [inviteCompanyUser] = useInviteCompanyUserMutation()
  const [createCompanyUser, { isLoading: isCreatingUser }] = useCreateCompanyUserMutation()
  const [updateStatus] = useUpdateCompanyUserStatusMutation()

  const pageRows = (data?.content?.users ?? []).map(toManageUserRow)
  const totalPages = Math.max(1, data?.content?.pagination.totalPages ?? 1)
  const safePage = Math.min(Math.max(1, currentPage), totalPages)

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
      pageRows
        .filter((user) => selectedUserIds.includes(user.id))
        .map((user) => ({
          Name: `${user.firstName} ${user.lastName}`,
          JoiningDate: user.joiningDate,
          Email: user.email,
          Status: user.status,
        })),
    )
  }, [pageRows, selectedUserIds])

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

  const applyStatusChange = useCallback(async () => {
    if (!pendingStatusUser) {
      return
    }
    const nextStatus = pendingStatusUser.status === 'active' ? 'suspended' : 'active'
    try {
      await updateStatus({ id: pendingStatusUser.id, body: { status: nextStatus } }).unwrap()
      showCustomToast({
        type: 'success',
        title: 'Success',
        message:
          nextStatus === 'suspended'
            ? 'User has been suspended.'
            : 'User has been reactivated successfully.',
      })
    } catch (err) {
      showCustomToast({ type: 'error', title: 'Error', message: getRtkErrorMessage(err) })
    } finally {
      setPendingStatusUser(null)
    }
  }, [pendingStatusUser, updateStatus])

  const ownerDomain = currentUser?.email?.split('@')[1]?.toLowerCase()

  const handleInvite = async (email: string) => {
    try {
      await inviteCompanyUser({ email }).unwrap()
      showCustomToast({
        type: 'success',
        title: 'Success',
        message: 'Invitation sent successfully.',
      })
    } catch (err) {
      showCustomToast({ type: 'error', title: 'Error', message: getRtkErrorMessage(err) })
    }
  }

  const handleCreate = async (values: CreateUserValues) => {
    try {
      await createCompanyUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: `${values.phoneCode}${values.phone}`.trim() || undefined,
        password: values.password,
      }).unwrap()
      showCustomToast({
        type: 'success',
        title: 'Success',
        message: 'User created and notified successfully.',
      })
      setShowCreateUser(false)
    } catch (err) {
      showCustomToast({ type: 'error', title: 'Error', message: getRtkErrorMessage(err) })
    }
  }

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

        {isFetching ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <CustomLoader />
          </div>
        ) : pageRows.length > 0 ? (
          <div className="flex min-h-0 w-full flex-1 flex-col gap-3 rounded-lg border border-bottomBorder p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <CustomCheckboxShipment isChecked={isAllSelected} onChange={handleSelectAll} />
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
        isSubmitting={isCreatingUser}
        onClose={() => setShowCreateUser(false)}
        onSubmit={(values) => {
          void handleCreate(values)
        }}
      />

      <InviteUserModal
        open={showInviteUser}
        onClose={() => setShowInviteUser(false)}
        onSubmit={(email) => {
          void handleInvite(email)
        }}
        ownerDomain={ownerDomain}
      />

      {pendingStatusUser ? (
        <UserStatusConfirmModal
          open
          intent={pendingStatusUser.status === 'active' ? 'suspend' : 'reactivate'}
          userName={`${pendingStatusUser.firstName} ${pendingStatusUser.lastName}`}
          onConfirm={() => {
            void applyStatusChange()
          }}
          onClose={() => setPendingStatusUser(null)}
        />
      ) : null}
    </>
  )
}
