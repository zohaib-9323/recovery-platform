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
  /**
   * The recovery document the entry lives on. Only the cross-import views set
   * it: an inbox row's document is fixed by the page it is rendered on, but the
   * Unprocessed Documents list spans every import job, so each row has to carry
   * its own. Required to delete a row.
   */
  documentId?: string
}

/**
 * A manual Create Shipment request that has been submitted to the backend but hasn't
 * resolved yet. Purely a client-side, in-memory concept — the backend has no "in
 * processing" state of its own. While an entry exists here, its `ciRow`/`c88Row` are
 * hidden from the Unprocessable Shipments table so the same files can't be submitted
 * twice; on success they're gone for good (refetch picks up the new Processable row),
 * on failure the entry is removed and the rows simply reappear as unprocessable.
 */
export type InboxInProcessingShipmentRow = {
  /** Client-generated id — this row doesn't exist on the backend yet, so there's no server id. */
  id: string
  documentId: string
  title: string
  ciFileName: string
  c88FileName: string
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
