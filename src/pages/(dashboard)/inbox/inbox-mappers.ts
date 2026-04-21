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

function mapAttachments(attachments: RecoveryDocumentAttachment[] | undefined): InboxAttachment[] {
  if (!attachments?.length) return []
  return attachments.map((attachment, index) => ({
    id: `${attachment.filename ?? 'attachment'}-${index}`,
    name: attachment.filename ?? `Attachment ${index + 1}`,
    size: attachment.contentType ?? '-',
    status: 'pending',
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
  const attachments = mapAttachments(record.attachments)
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
    attachments,
    shipments: mapProcessableRows(record.processable, record.createdAt),
    unprocessedShipments: mapUnprocessedRows(record.unprocessable),
  }
}
