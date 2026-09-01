import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import type { ManageUserRow } from '@/data/mock/manage-users'
import { MU } from '@/lib/manage-users-copy'
import { getUserStatusStyle } from '@/lib/manage-users-table-helper'

import { StatusTag } from './status-tag'
import { UserRowActionMenu, type UserRowAction } from './user-row-action-menu'

export type ManageUsersTableProps = {
  data: ManageUserRow[]
  selectedUserIds: string[]
  onCheckChange: (id: string) => void
  onRowAction: (action: UserRowAction, user: ManageUserRow) => void
}

/**
 * Figma column widths across the 1088px table: Name 260, Joining Date 202,
 * Email 320, Status 210, Actions 72 — expressed as percentages so the table
 * still scales, with a min-width that lets the wrapper scroll when squeezed.
 */
const HEAD_CELL_CLASS = 'py-0 text-left text-xxsmall font-normal text-black'
const BODY_CELL_CLASS = 'py-0 text-xsmall font-normal text-black'

export function ManageUsersTable({
  data,
  selectedUserIds,
  onCheckChange,
  onRowAction,
}: ManageUsersTableProps) {
  return (
    <div className="mx-auto w-full overflow-hidden rounded-lg border border-bottomBorder">
      <div className="no-scrollbar w-full overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed rounded-lg bg-white">
          <thead className="bg-greyFour">
            <tr className="h-[50px]">
              <th className={`${HEAD_CELL_CLASS} w-[24%] pl-6 pr-3`}>{MU.name}</th>
              <th className={`${HEAD_CELL_CLASS} w-[18.5%] pr-3`}>{MU.joiningDate}</th>
              <th className={`${HEAD_CELL_CLASS} w-[29.5%] pr-3`}>{MU.email}</th>
              <th className={`${HEAD_CELL_CLASS} w-[19.5%] pr-3`}>{MU.status}</th>
              <th className={`${HEAD_CELL_CLASS} w-[8.5%] pr-6 text-right`}>{MU.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user) => {
              const fullName = `${user.firstName} ${user.lastName}`
              return (
                <tr
                  key={user.id}
                  className="h-[63px] border-b border-bottomBorder transition hover:bg-[var(--hover-color)]"
                >
                  <td className={`${BODY_CELL_CLASS} pl-5 pr-3`}>
                    <div className="flex items-center gap-[10px]">
                      <CustomCheckboxShipment
                        width="min-w-6"
                        height="h-6"
                        iconSize="text-[10px]"
                        isChecked={selectedUserIds.includes(user.id)}
                        onChange={() => onCheckChange(user.id)}
                      />
                      <span className="truncate font-medium capitalize text-black" title={fullName}>
                        {fullName}
                      </span>
                    </div>
                  </td>
                  <td className={`${BODY_CELL_CLASS} pr-3`}>{user.joiningDate}</td>
                  <td className={`${BODY_CELL_CLASS} pr-3`}>
                    <span className="block truncate" title={user.email}>
                      {user.email}
                    </span>
                  </td>
                  <td className={`${BODY_CELL_CLASS} pr-3`}>
                    <StatusTag className={getUserStatusStyle(user.status)} label={user.status} />
                  </td>
                  <td className={`${BODY_CELL_CLASS} pr-5 text-right`}>
                    <UserRowActionMenu
                      options={
                        user.status === 'active'
                          ? ['suspend', 'details']
                          : ['reactivate', 'details']
                      }
                      onSelect={(action) => onRowAction(action, user)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
