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
  /**
   * The item's current s3Key, as last seen from the server. Echoed back on retry so the
   * backend can detect a stale selection (409) if another action shifted this index in
   * the meantime — see RetryUnprocessableTargetDto server-side.
   */
  s3Key?: string
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
