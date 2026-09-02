import type { ManageUserStatus, UserRefundStatus, UserReportStatus } from '@/data/mock/manage-users'

/**
 * Badge palettes for the Manage Users screens.
 *
 * The Figma tags use 10%-opacity fills over white, which resolve exactly to the
 * existing tailwind tokens: rgba(46,125,50,.1) → `lightGreenOne`,
 * rgba(198,40,40,.1) → `lightRed`, rgba(227,166,2,.1) → `lightYellowThree`.
 */
export function getUserStatusStyle(status: ManageUserStatus | 'pending'): string {
  switch (status) {
    case 'active':
      return 'bg-lightGreenOne text-green'
    case 'suspended':
      return 'bg-lightRed text-redOne'
    default:
      return 'bg-lightYellowThree text-yellow'
  }
}

export function getReportStatusStyle(status: UserReportStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-lightGreenOne text-green'
    case 'rejected':
      return 'bg-lightRed text-redOne'
    default:
      return 'bg-lightYellowThree text-yellow'
  }
}

export function getReportStatusText(status: UserReportStatus): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

export function getRefundStatusStyle(status: UserRefundStatus): string {
  return status === 'refunded' ? 'bg-lightGreenOne text-green' : 'bg-lightYellowThree text-yellow'
}

export function getRefundStatusText(status: UserRefundStatus): string {
  return status === 'refunded' ? 'Refunded' : 'Refund Pending'
}

export const userStatusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
] as const

export type UserStatusFilter = (typeof userStatusFilterOptions)[number]['value']
