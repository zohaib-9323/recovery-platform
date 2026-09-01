import type {
  RecoveryCombinedDocument,
  RecoveryDocumentAttachment,
  RecoveryDocumentUnprocessable,
} from '@/types/recovery-inbox-api'

import type {
  InboxAttachment,
  InboxEmail,
  InboxShipmentRow,
  InboxUnprocessedShipmentRow,
} from './types'

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatFileSize(size?: number): string {
  if (!size || Number.isNaN(size) || size <= 0) return 'N/A'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getAttachmentSizeLabel(size?: number, contentType?: string, fallback?: string): string {
  if (typeof size === 'number' && size > 0) return formatFileSize(size)
  return contentType || fallback || 'N/A'
}

function isAbsoluteUrl(value?: string): boolean {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function encodeS3KeyForUrl(s3Key: string): string {
  return s3Key
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function resolveDownloadFileUrl(
  fileUrl?: string,
  s3Key?: string,
  bucket?: string,
): string | undefined {
  if (isAbsoluteUrl(fileUrl)) return fileUrl
  if (isAbsoluteUrl(s3Key)) return s3Key
  if (bucket && s3Key) {
    return `https://${bucket}.s3.amazonaws.com/${encodeS3KeyForUrl(s3Key)}`
  }
  return undefined
}

/**
 * Maps the backend's machine-readable `failureReasonCode` to a short label
 * for the unprocessed-shipments table. Falls back to the generic 'Failed'
 * for documents ingested before this field existed, or any code not yet
 * mapped here — never throws, never shows a raw enum string to the user.
 */
const FAILURE_REASON_LABELS: Record<string, string> = {
  UNSUPPORTED_BINARY_FORMAT: 'Unsupported format',
  GEMINI_ERROR: 'AI processing error',
  PARSING_FAILURE: 'Parsing failed',
  // Document classified fine (it IS a C88 or a commercial invoice/PO) but its
  // pairing counterpart was never found anywhere else in the same email.
  C88_MISSING: 'C88 missing',
  PO_MISSING: 'CI missing',
  // Nothing was wrong with the file — the AI call for its batch failed, or the
  // model's response omitted it. Both are retryable, which is why neither is
  // labelled as a parsing or format problem.
  AI_CALL_FAILED: 'AI unavailable — retry',
  AI_NO_CLASSIFICATION: 'Not analysed',
  // Read correctly, but deliberately set aside.
  DUPLICATE_DOCUMENT: 'Duplicate document',
  // Name the document rather than what it is not.
  PACKING_LIST: 'Packing list',
  NOT_PAIRABLE_TYPE: 'Not a C88 or invoice',
}

/**
 * The short status label for one failure reason code. Exported so screens that
 * render unprocessable files WITHOUT going through `mapRecoveryDocumentToInboxEmail`
 * — the cross-import Unprocessed Documents list, which flattens rows server-side —
 * show the same words for the same code instead of maintaining a second table.
 */
/**
 * How a document's type is written in the UI.
 *
 * The backend classifies a commercial invoice as `PO` — the same enum the main
 * shipment pipeline has always used, where a purchase order and a commercial
 * invoice are the same side of a pair. Users call that document a CI, and every
 * other label in these screens already does ("CI missing", the CI picker in
 * Create Shipment), so showing the raw `PO` here was the odd one out.
 *
 * Anything unrecognised is passed through untouched rather than mapped to a
 * guess, so a new backend type shows up as itself instead of silently
 * displaying as something it is not.
 */
export function documentTypeLabel(type?: string | null): string {
  if (!type) return ''
  return type.trim().toUpperCase() === 'PO' ? 'CI' : type
}

export function getUnprocessableStatusLabel(failureReasonCode?: string | null): string {
  return (failureReasonCode && FAILURE_REASON_LABELS[failureReasonCode]) || 'Failed'
}

function getUnprocessableStatus(shipment: RecoveryDocumentUnprocessable): {
  status: string
  statusDetail?: string
} {
  const code = shipment.failureReasonCode
  const status = getUnprocessableStatusLabel(code)
  const statusDetail = shipment.extractedData?.summary || code || undefined
  return { status, statusDetail }
}

function isAttachmentLike(value: unknown): value is RecoveryDocumentAttachment {
  if (!value || typeof value !== 'object') return false
  const candidate = value as RecoveryDocumentAttachment
  return Boolean(candidate.filename || candidate.fileUrl || candidate.s3Key)
}

function mapAttachments(attachments: RecoveryDocumentAttachment[] | undefined): InboxAttachment[] {
  if (!attachments?.length) return []
  return attachments.map((attachment, index) => ({
    id: `${attachment.filename ?? 'attachment'}-${index}`,
    name: attachment.filename ?? `Attachment ${index + 1}`,
    size: getAttachmentSizeLabel(attachment.size, attachment.contentType),
    status: 'pending',
    fileUrl: resolveDownloadFileUrl(attachment.fileUrl, attachment.s3Key, attachment.bucket),
    s3Key: attachment.s3Key,
    bucket: attachment.bucket,
  }))
}

function mapProcessableRows(
  processable: RecoveryCombinedDocument['processable'],
  createdAt?: string,
): InboxShipmentRow[] {
  if (!processable?.length) return []

  const mapProcessableAttachment = (
    value: unknown,
    key: string,
    shipmentId: string,
    shipmentIndex: number,
  ): InboxAttachment | null => {
    if (!isAttachmentLike(value)) return null
    return {
      id: `processable-row-${shipmentIndex}-${key}`,
      name:
        value.filename ||
        `${shipmentId || `shipment-${shipmentIndex + 1}`}-${key}.${value.contentType === 'application/pdf' ? 'pdf' : 'file'}`,
      size: getAttachmentSizeLabel(value.size, value.contentType),
      status: 'passed',
      fileUrl: resolveDownloadFileUrl(value.fileUrl, value.s3Key, value.bucket),
      s3Key: value.s3Key,
      bucket: value.bucket,
      recordType: 'processed',
    }
  }

  return processable.map((shipment, index) => ({
    id: shipment.shipmentId ?? `${index}`,
    sourceIndex: index,
    // Prefer the backend-derived shipment title (email subject > PO-extracted
    // title); only fall back to the raw shipmentId for older records or rows
    // where neither source produced a title.
    title: shipment.shipmentTitle || shipment.shipmentId || '-',
    date: formatDateTime(createdAt),
    c88: mapProcessableAttachment(shipment.c88, 'c88', shipment.shipmentId ?? '', index),
    po: mapProcessableAttachment(shipment.po, 'po', shipment.shipmentId ?? '', index),
  }))
}

function mapUnprocessedRows(
  unprocessable: RecoveryCombinedDocument['unprocessable'],
): InboxUnprocessedShipmentRow[] {
  if (!unprocessable?.length) return []
  return unprocessable.map((shipment, index) => {
    const { status, statusDetail } = getUnprocessableStatus(shipment)
    return {
      id: shipment.filename ?? `${index}`,
      sourceIndex: index,
      fileName: shipment.filename ?? `Unprocessable File #${index + 1}`,
      // Backend uses 'PO' as its legacy name for a commercial invoice, so both
      // 'PO' and 'CI' from the backend must display as 'CI' here. Other types
      // (e.g. 'C88', 'UNKNOWN') pass through unchanged.
      type: shipment.type === 'PO' || shipment.type === 'CI' ? 'CI' : (shipment.type ?? 'UNKNOWN'),
      status,
      statusDetail,
      s3Key: shipment.s3Key,
    }
  })
}

export function mapRecoveryDocumentToInboxEmail(record: RecoveryCombinedDocument): InboxEmail {
  const baseAttachments = mapAttachments(record.attachments)
  const processableAttachments: InboxAttachment[] = []
  ;(record.processable || []).forEach((shipment, shipmentIndex) => {
    Object.entries(shipment || {}).forEach(([key, value]) => {
      if (key === 'shipmentId' || key === 'matchedShipmentRefs') return
      if (!isAttachmentLike(value)) return
      processableAttachments.push({
        id: `processable-${shipmentIndex}-${key}`,
        name:
          value.filename ||
          `${shipment.shipmentId || `shipment-${shipmentIndex + 1}`}-${key}.${value.contentType === 'application/pdf' ? 'pdf' : 'file'}`,
        size: getAttachmentSizeLabel(value.size, value.contentType),
        status: 'passed',
        fileUrl: resolveDownloadFileUrl(value.fileUrl, value.s3Key, value.bucket),
        s3Key: value.s3Key,
        bucket: value.bucket,
        recordType: 'processed',
      })
    })
  })

  // `unprocessable[]` is embedded inside a normal PROCESSED RecoveryDocument
  // (a file that failed auto-classification/pairing, not an actual quarantine
  // email) — it must NOT be tagged 'quarantined' here, or the download call
  // sends recordType=quarantined for a real RecoveryDocument id, which makes
  // the backend look it up in the quarantine collection instead and 404.
  // Leave recordType unset so it falls back to `normalizedRecordType` below,
  // which reflects the actual parent record's type.
  const unprocessableAttachments: InboxAttachment[] = (record.unprocessable || []).map(
    (shipment, index) => ({
      id: `unprocessable-${shipment.filename ?? index}`,
      name: shipment.filename ?? `Unprocessable File #${index + 1}`,
      size: getAttachmentSizeLabel(shipment.size, shipment.contentType, shipment.type),
      status: 'failed',
      fileUrl: resolveDownloadFileUrl(shipment.fileUrl, shipment.s3Key, shipment.bucket),
      s3Key: shipment.s3Key,
      bucket: shipment.bucket,
    }),
  )

  const attachments = [
    ...baseAttachments,
    ...processableAttachments,
    ...unprocessableAttachments,
  ].filter(
    (attachment, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.name === attachment.name &&
          candidate.size === attachment.size &&
          candidate.status === attachment.status,
      ) === index,
  )
  const normalizedRecordType =
    record.recordType === 'quarantined' ||
    String(record.status || '')
      .toLowerCase()
      .includes('quarant')
      ? 'quarantined'
      : 'processed'
  const normalizedAttachments = attachments.map((attachment) => ({
    ...attachment,
    recordType: attachment.recordType ?? normalizedRecordType,
  }))
  const fileCount = record.attachmentsCount ?? attachments.length

  return {
    id: record._id,
    messageId: record.messageId || `MSG-${record._id.slice(-6).toUpperCase()}`,
    sender: record.senderEmail || record.senderDomain || '-',
    subject: record.subject || '(No subject)',
    receivedLabel: formatDateTime(record.createdAt),
    fileCount,
    fromAddress: record.senderEmail || '-',
    domain: record.senderDomain || '-',
    receivedDetail: formatDateTime(record.createdAt),
    status: record.status || record.recordType || '-',
    reason: record.reason || '-',
    createdAt: formatDateTime(record.createdAt),
    updatedAt: formatDateTime(record.updatedAt || record.createdAt),
    attachments: normalizedAttachments,
    shipments: mapProcessableRows(record.processable, record.createdAt),
    unprocessedShipments: mapUnprocessedRows(record.unprocessable),
  }
}
