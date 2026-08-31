import type { ManageUserRow, ManageUserStatus } from '@/data/mock/manage-users'
import type { CompanyUserListItem } from '@/types/recovery-company-users-api'

function formatJoiningDate(value: string | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Maps the `recovery/company-users` list response into the row shape the
 * existing (Figma-matched) table/mock components already expect. */
export function toManageUserRow(item: CompanyUserListItem): ManageUserRow {
  return {
    id: item._id,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    joiningDate: formatJoiningDate(item.joiningDate),
    status: (item.status === 'suspended' ? 'suspended' : 'active') as ManageUserStatus,
  }
}
