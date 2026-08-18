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
