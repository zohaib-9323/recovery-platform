import { Plus } from 'lucide-react'

import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import { MU } from '@/lib/manage-users-copy'
import type { UserStatusFilter as UserStatusFilterValue } from '@/lib/manage-users-table-helper'

import { UserStatusFilter } from './user-status-filter'

export type ManageUsersToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: UserStatusFilterValue
  onStatusFilterChange: (value: UserStatusFilterValue) => void
  onCreateUser: () => void
  onInviteUser: () => void
}

export function ManageUsersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateUser,
  onInviteUser,
}: ManageUsersToolbarProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <p className="min-w-fit text-large font-semibold leading-[33px] text-black">
        {MU.manageUsers}
      </p>

      <div className="flex w-full flex-wrap items-center gap-[10px] sm:w-auto">
        <ShipmentsSearchInput
          id="manage-users-search"
          value={search}
          onChange={onSearchChange}
          placeholder={MU.search}
          padding="py-2.5"
          className="w-full sm:w-[280px] lg:w-[350px]"
          inputWidthClass="w-full"
        />

        <UserStatusFilter value={statusFilter} onChange={onStatusFilterChange} />

        <button
          type="button"
          id="create-user-btn"
          onClick={onCreateUser}
          className="flex h-10 items-center justify-center gap-2 rounded-[4px] border border-bottomBorder bg-white px-3 text-normal font-light leading-none text-black transition hover:bg-greyFour"
        >
          <span aria-hidden className="icon-mulite-user text-normal" />
          {MU.createUser}
        </button>

        <button
          type="button"
          id="invite-user-btn"
          onClick={onInviteUser}
          className="flex h-10 items-center justify-center gap-2 rounded-[4px] bg-yellow px-3 text-normal font-light leading-none text-white transition hover:opacity-90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          {MU.inviteUser}
        </button>
      </div>
    </div>
  )
}
