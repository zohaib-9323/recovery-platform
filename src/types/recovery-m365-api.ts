import type { RecoveryApiEnvelope } from './recovery-user-api'
import type { RecoveryCombinedDocument } from './recovery-inbox-api'

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
  /** Emails all fetched; the AI pairing pass that creates shipments is still running. */
  | 'pairing'
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
  classifiedType: 'C88' | 'PO' | 'PL' | null
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

/**
 * The import job's unified processable / unprocessable shipment lists.
 *
 * Deliberately the SAME `RecoveryCombinedDocument` shape the Inbox detail
 * endpoint returns: the backend produces one recovery document per import job
 * (holding that job's whole set, not one document per email), so the Inbox's
 * mappers, tables and per-row actions all apply unchanged.
 *
 * `content` is null while the job is still running, and for a finished job
 * whose documents produced nothing to pair — a normal empty state, not an error.
 */
export type M365ImportJobShipmentsEnvelope = RecoveryApiEnvelope<RecoveryCombinedDocument | null>

export type M365ImportJobDetailEnvelope = RecoveryApiEnvelope<M365ImportJobSummary>
export type M365ImportJobItemsEnvelope = RecoveryApiEnvelope<M365ImportJobItemsContent>

// ── Cross-import unprocessed documents ───────────────────────────────────────

/**
 * One unprocessable file, flattened out of the import-job document that holds
 * it — the row shape of the cross-import "Unprocessed Documents" screen.
 *
 * `documentId` + `index` is the coordinate the create-shipment call addresses a
 * file by, and the pair is also its row identity: `documentId` alone is not
 * unique (one import job's document holds every unpaired file from that job).
 */
export type M365UnprocessedDocument = {
  /** `${documentId}:${index}` — stable across pages, safe as a selection key. */
  id: string
  documentId: string
  index: number
  filename: string
  type: string
  size: number | null
  contentType: string | null
  failureReasonCode: string | null
  summary: string | null
  /** Null when the file's bytes were never stored — the row renders but cannot be paired. */
  s3Key: string | null
  bucket: string | null
  importJobId: string
  folderNames: string[]
  mailboxEmail: string | null
  importedAt: string | null
}

/** An import job that currently contributes at least one unprocessable file. */
export type M365UnprocessedDocumentsJob = {
  id: string
  folderNames: string[]
  mailboxEmail: string | null
  importedAt: string | null
}

export type M365UnprocessedDocumentsContent = {
  items: M365UnprocessedDocument[]
  total: number
  page: number
  limit: number
  totalPages: number
  /** Unaffected by the active filters, so the filter can always be widened again. */
  importJobs: M365UnprocessedDocumentsJob[]
}

export type M365UnprocessedDocumentsQuery = {
  page?: number
  limit?: number
  importJobId?: string
  search?: string
  type?: string
}

/** One side of a cross-import manual pair. */
export type M365UnprocessedDocumentSelection = {
  documentId: string
  index: number
  s3Key: string
}

export type M365CreateCrossImportShipmentBody = {
  title: string
  ci: M365UnprocessedDocumentSelection
  /** The new shipment row is stored on this side's document. */
  c88: M365UnprocessedDocumentSelection
  /**
   * Optional packing list. Contributes fuller line-item descriptions only — it
   * never affects quantities, prices or duty. Omit for the normal two-document
   * shipment.
   */
  pl?: M365UnprocessedDocumentSelection
}

export type M365UnprocessedDocumentsEnvelope = RecoveryApiEnvelope<M365UnprocessedDocumentsContent>
export type M365CreateCrossImportShipmentEnvelope = RecoveryApiEnvelope<{
  documentId: string
  shipmentId: string
}>

// ── Cross-import processable shipments ───────────────────────────────────────

/** One half of a paired shipment, as the Processed Documents table links to it. */
export type M365ProcessableShipmentFile = {
  filename: string | null
  s3Key: string | null
  bucket: string | null
  contentType: string | null
  size: number | null
}

/**
 * One paired C88 + CI from any import job. Pairs created by hand on the
 * Unprocessed Documents screen appear here alongside automatically paired ones —
 * the backend stores a manual pair on the C88 side's import-job document, so it
 * is the same kind of row.
 */
export type M365ProcessableShipment = {
  /** `${documentId}:${index}`. */
  id: string
  documentId: string
  index: number
  /** The document-local pairing key. */
  shipmentKey: string | null
  /**
   * The persisted shipment's id, for linking to /shipments/:id. Null while a
   * pair exists but its shipment has not been created yet — a normal transient
   * state, so the row still renders.
   */
  shipmentId: string | null
  title: string | null
  date: string | null
  c88: M365ProcessableShipmentFile
  po: M365ProcessableShipmentFile
  importJobId: string
  folderNames: string[]
  mailboxEmail: string | null
  importedAt: string | null
}

export type M365ProcessableShipmentsContent = {
  items: M365ProcessableShipment[]
  total: number
  page: number
  limit: number
  totalPages: number
  importJobs: M365UnprocessedDocumentsJob[]
}

export type M365ProcessableShipmentsQuery = {
  page?: number
  limit?: number
  importJobId?: string
  search?: string
}

export type M365ProcessableShipmentsEnvelope = RecoveryApiEnvelope<M365ProcessableShipmentsContent>
