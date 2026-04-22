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
  shipVia: string
  po: string
}

export type InboxUnprocessedShipmentRow = {
  id: string
  sourceIndex: number
  fileName: string
  type: string
  shipmentRef: string
  status: 'Failed'
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
