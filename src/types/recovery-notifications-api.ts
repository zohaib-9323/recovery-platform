import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'

export type RecoveryNotificationOptions = {
  shipmentId?: string
  [key: string]: unknown
}

export type RecoveryNotificationRecord = {
  _id: string
  title: string
  description: string
  isRead: boolean
  screenName?: string
  isAdmin?: boolean
  options?: RecoveryNotificationOptions
  firstName?: string
  lastName?: string
  createdAt?: string
}

export type RecoveryNotificationsListQuery = {
  /** 0 = all, 1 = read, 2 = unread — matches backend NotificationStatus enum */
  status?: 0 | 1 | 2
  search?: string
  page?: number
  limit?: number
}

export type RecoveryNotificationsListContent = {
  data: RecoveryNotificationRecord[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type RecoveryNotificationsListEnvelope =
  RecoveryApiEnvelope<RecoveryNotificationsListContent>

export type RecoveryNotificationCounts = {
  total: number
  unread: number
  read: number
}

export type RecoveryNotificationCountsEnvelope = RecoveryApiEnvelope<RecoveryNotificationCounts>
