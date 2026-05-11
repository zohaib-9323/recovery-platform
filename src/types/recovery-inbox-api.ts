import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'

export type RecoveryDocumentRecordType = 'processed' | 'quarantined'

export type RecoveryDocumentAttachment = {
  filename?: string
  contentType?: string
  size?: number
  s3Key?: string
  fileUrl?: string
  bucket?: string
}

export type RecoveryDocumentProcessable = {
  shipmentId?: string
  matchedShipmentRefs?: string[]
  [key: string]: unknown
}

export type RecoveryDocumentUnprocessable = {
  filename?: string
  type?: string
  shipmentRefs?: string[]
  contentType?: string
  size?: number
  s3Key?: string
  fileUrl?: string
  bucket?: string
}

export type RecoveryCombinedDocument = {
  recordType?: RecoveryDocumentRecordType
  _id: string
  recoveryUserId?: string
  messageId?: string
  senderEmail?: string
  senderDomain?: string
  subject?: string
  sesSecurityCheckPassed?: boolean | null
  reason?: string
  status?: string
  processable?: RecoveryDocumentProcessable[]
  unprocessable?: RecoveryDocumentUnprocessable[]
  processableCount?: number
  unprocessableCount?: number
  attachments?: RecoveryDocumentAttachment[]
  attachmentsCount?: number
  createdAt?: string
  updatedAt?: string
}

export type RecoveryInboxDocumentsListContent = {
  data: RecoveryCombinedDocument[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export type RecoveryInboxDocumentDetailContent = {
  data: RecoveryCombinedDocument
}

export type RecoveryInboxDocumentsListEnvelope =
  RecoveryApiEnvelope<RecoveryInboxDocumentsListContent>
export type RecoveryInboxDocumentDetailEnvelope =
  RecoveryApiEnvelope<RecoveryInboxDocumentDetailContent>
