export type InboxAttachmentStatus = 'passed' | 'failed' | 'pending'

export type InboxAttachment = {
  id: string
  name: string
  size: string
  status: InboxAttachmentStatus
  fileUrl?: string
  s3Key?: string
  bucket?: string
  recordType?: 'processed' | 'quarantined'
}

export type InboxShipmentRow = {
  id: string
  sourceIndex: number
  title: string
  date: string
  c88: InboxAttachment | null
  po: InboxAttachment | null
}

export type InboxUnprocessedShipmentRow = {
  id: string
  sourceIndex: number
  fileName: string
  type: string
  /** Human-readable status label — derived from the backend's failureReasonCode when available, otherwise the generic fallback. */
  status: string
  /** Longer explanation shown as a tooltip on the status cell; undefined when there's nothing more specific than `status` itself. */
  statusDetail?: string
}

export type InboxEmail = {
  id: string
  messageId: string
  sender: string
  subject: string
  receivedLabel: string
  fileCount: number
  fromAddress: string
  domain: string
  receivedDetail: string
  status: string
  reason: string
  createdAt: string
  updatedAt: string
  attachments: InboxAttachment[]
  shipments: InboxShipmentRow[]
  unprocessedShipments: InboxUnprocessedShipmentRow[]
}
