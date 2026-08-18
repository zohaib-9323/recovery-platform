import type { RecoveryApiEnvelope } from './recovery-user-api'

export type M365ConnectionStatus = {
  connected: boolean
  email: string | null
  connectedAt: string | null
  status: string | null
}

export type M365AuthUrlContent = {
  url: string
}

export type M365Folder = {
  id: string
  displayName: string
  totalItemCount: number
  unreadItemCount: number
  parentFolderId: string | null
  childFolderCount: number
  depth: number
}

export type M365FoldersContent = {
  folders: M365Folder[]
}

export type M365ImportJobBody = {
  folderId: string
  folderName: string
  dateRangeStart: string
  dateRangeEnd: string
}

export type M365ImportJobContent = {
  importJobId: string
}

export type M365ImportJobStatus =
  | 'queued'
  | 'running'
  | 'retrying'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'

export type M365ImportJobStats = {
  totalDiscovered: number | null
  scanned: number
  matched: number
  added: number
  skipped: number
  failed: number
}

/** One failed email/attachment recorded by the processor. */
export type M365ImportJobFailure = {
  messageId: string
  subject: string
  attachmentName: string | null
  receivedDateTime: string
  reason: string
  detail: string
  attemptCount: number
  lastAttemptAt: string
}

export type M365ImportJobSummary = {
  id: string
  status: M365ImportJobStatus
  mailboxEmail: string
  folderName: string
  dateRangeStart: string
  dateRangeEnd: string
  stats: M365ImportJobStats
  jobRetryCount: number
  fatalError: string | null
  /** Per-email failures (max 500) — only present on detail endpoint. */
  failures?: M365ImportJobFailure[]
  failuresCapped?: boolean
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export type M365ImportJobsListContent = {
  items: M365ImportJobSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type M365ImportJobsListQuery = {
  page?: number
  limit?: number
}

export type M365StatusEnvelope = RecoveryApiEnvelope<M365ConnectionStatus>
export type M365AuthUrlEnvelope = RecoveryApiEnvelope<M365AuthUrlContent>
export type M365FoldersEnvelope = RecoveryApiEnvelope<M365FoldersContent>
export type M365ImportJobEnvelope = RecoveryApiEnvelope<M365ImportJobContent>
export type M365ImportJobsListEnvelope = RecoveryApiEnvelope<M365ImportJobsListContent>

export type M365FetchedItemStatus = 'fetched' | 'failed' | 'duplicate'

export type M365FetchedItem = {
  id: string
  messageId: string
  subject: string
  fromEmail: string
  receivedDateTime: string
  attachmentName: string
  attachmentContentType: string
  attachmentSizeBytes: number
  attachmentSizeFormatted: string
  status: M365FetchedItemStatus
  failureDetail: string | null
  /** Graph API message ID — used with graphAttachmentId for on-demand download. */
  graphMessageId: string | null
  /** Graph API attachment ID — used with graphMessageId for on-demand download. */
  graphAttachmentId: string | null
  /** S3 bucket the file was uploaded to. null when S3 not configured. */
  s3Bucket: string | null
  /** S3 object key for the uploaded file. null when S3 not configured. */
  s3Key: string | null
  createdAt: string
}

export type M365ImportJobItemsContent = {
  items: M365FetchedItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type M365ImportJobItemsQuery = {
  id: string
  page?: number
  limit?: number
}

export type M365ImportJobDetailEnvelope = RecoveryApiEnvelope<M365ImportJobSummary>
export type M365ImportJobItemsEnvelope = RecoveryApiEnvelope<M365ImportJobItemsContent>
