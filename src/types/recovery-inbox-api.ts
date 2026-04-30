import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'

export type RecoveryDocumentRecordType = 'processed' | 'quarantined'

export type RecoveryInboxAttachment = {
  fileName?: string
  fileSize?: number
  status?: string
  contentType?: string
  s3Key?: string
  bucket?: string
}

export type RecoveryInboxRecord = {
  _id: string
  shipmentId?: string
  subject?: string
  senderEmail?: string
  senderDomain?: string
  createdAt?: string
  updatedAt?: string
  c88?: RecoveryInboxAttachment
  po?: RecoveryInboxAttachment
  processableShipments?: unknown[]
  unprocessableShipments?: unknown[]
}

export type RecoveryInboxDocumentsListContent = {
  data?: RecoveryInboxRecord[]
  page?: number
  totalPages?: number
}

export type RecoveryInboxDocumentDetailContent = {
  data?: RecoveryInboxRecord
}

export type RecoveryInboxDocumentsListEnvelope =
  RecoveryApiEnvelope<RecoveryInboxDocumentsListContent>
export type RecoveryInboxDocumentDetailEnvelope =
  RecoveryApiEnvelope<RecoveryInboxDocumentDetailContent>
