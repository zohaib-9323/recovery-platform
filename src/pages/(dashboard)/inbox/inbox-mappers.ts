import type {
  RecoveryCombinedDocument,
  RecoveryDocumentAttachment,
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
  return processable.map((shipment, index) => ({
    id: shipment.shipmentId ?? `${index}`,
    sourceIndex: index,
    title: shipment.shipmentId ?? '-',
    date: formatDateTime(createdAt),
    shipVia: '-',
    po: shipment.matchedShipmentRefs?.join(', ') || '-',
  }))
}

function mapUnprocessedRows(
  unprocessable: RecoveryCombinedDocument['unprocessable'],
): InboxUnprocessedShipmentRow[] {
  if (!unprocessable?.length) return []
  return unprocessable.map((shipment, index) => ({
    id: shipment.filename ?? `${index}`,
    sourceIndex: index,
    fileName: shipment.filename ?? `Unprocessable File #${index + 1}`,
    type: shipment.type ?? 'UNKNOWN',
    shipmentRef: shipment.shipmentRefs?.[0] ?? '-',
    status: 'Failed',
  }))
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

  const unprocessableAttachments: InboxAttachment[] = (record.unprocessable || []).map(
    (shipment, index) => ({
      id: `unprocessable-${shipment.filename ?? index}`,
      name: shipment.filename ?? `Unprocessable File #${index + 1}`,
      size: getAttachmentSizeLabel(shipment.size, shipment.contentType, shipment.type),
      status: 'failed',
      fileUrl: resolveDownloadFileUrl(shipment.fileUrl, shipment.s3Key, shipment.bucket),
      s3Key: shipment.s3Key,
      bucket: shipment.bucket,
      recordType: 'quarantined',
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
