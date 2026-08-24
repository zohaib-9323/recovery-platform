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

export type M365ImportFolder = {
  folderId: string
  folderName: string
}

export type M365ImportJobBody = {
  /** One or more folders to scan in a single import job. */
  folders: M365ImportFolder[]
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
  /** Emails where at least one attachment cleared the Stage 1 metadata filter. */
  matched: number
  /**
   * Emails that had attachments but Stage 1 rejected every one of them.
   * They still appear in the items list, with an empty `documents` array and a
   * populated `skipped` list — so `matched + unmatched` is the number of email
   * groups the detail page renders.
   */
  unmatched: number
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
  /** First folder's name — kept for existing single-folder UI. */
  folderName: string
  /** Every folder this job covers. Always at least one entry. */
  folders: M365ImportFolder[]
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

/** One attachment document within an email group returned by GET /import-jobs/:id/items */
export type M365DocumentItem = {
  id: string
  attachmentName: string
  attachmentContentType: string
  attachmentSizeBytes: number
  attachmentSizeFormatted: string
  status: M365FetchedItemStatus
  failureDetail: string | null
  /** Document type resolved by the classifier; null when imported unverified. */
  classifiedType: 'C88' | 'PO' | null
  /**
   * Imported WITHOUT its content being verified — an unreadable scan.
   * Kept deliberately (losing a scanned C88 is worse than importing a stray
   * file), but it needs a human to confirm what it is.
   */
  unverified: boolean
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

/** Which stage of the import funnel discarded an attachment. */
export type M365SkipStage = 'metadata' | 'verification' | 'classification'

export type M365SkipReason =
  | 'unsupported_format'
  | 'zero_byte'
  | 'signature_asset'
  | 'too_large'
  | 'download_failed'
  | 'duplicate'
  | 'type_mismatch'
  | 'not_shipment_document'
  | 'classification_error'

/**
 * One attachment the import funnel discarded, and why.
 *
 * Metadata only — the file itself was never stored, so there is deliberately
 * nothing here to download and no preview to show.
 */
export type M365SkippedItem = {
  id: string
  attachmentName: string
  attachmentContentType: string | null
  attachmentSizeBytes: number
  attachmentSizeFormatted: string
  stage: M365SkipStage
  reason: M365SkipReason
  /** Short human-readable explanation, ready to render. */
  reasonLabel: string
  /** Optional extra technical detail. */
  detail: string | null
  createdAt: string
}

/** One email with all its qualifying attachment documents. Returned by GET /import-jobs/:id/items */
export type M365EmailGroup = {
  messageId: string
  subject: string
  fromEmail: string
  /** Sender's display name, when Microsoft supplied one. */
  fromName: string | null
  /**
   * Mailbox folder(s) this email was found in, e.g. ['Inbox'].
   *
   * An array because grouping is by Message-ID and the same message can exist
   * in two folders at once. Empty for emails imported before folder tracking.
   */
  folderNames: string[]
  receivedDateTime: string
  documents: M365DocumentItem[]
  /** Attachments from this email that were NOT imported, with reasons. */
  skipped: M365SkippedItem[]
}

/**
 * @deprecated Flat item shape — kept only for download-endpoint compatibility.
 * The list endpoint now returns M365EmailGroup[].
 */
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
  graphMessageId: string | null
  graphAttachmentId: string | null
  s3Bucket: string | null
  s3Key: string | null
  createdAt: string
}

export type M365ImportJobItemsContent = {
  /** Paginated email groups — each item is one email with all its documents. */
  items: M365EmailGroup[]
  /** Total number of distinct emails (not documents) for this job. */
  total: number
  page: number
  /** Max email groups per page (default 10). */
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
