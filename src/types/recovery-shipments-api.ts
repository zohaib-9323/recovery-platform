import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'

export type RecoveryShipmentStatusCode = number | string
export type RecoveryRefundStatusCode = number | string

export type RecoveryShipmentRecord = {
  _id: string
  shipmentTitle?: string
  shipmentReference?: string
  purchaseOrderNumber?: string
  date?: string
  createdAt?: string
  shipVia?: string
  status?: RecoveryShipmentStatusCode
  refund_status?: RecoveryRefundStatusCode
  /** Some list/detail payloads use camelCase */
  refundStatus?: RecoveryRefundStatusCode
  /** HS code challenge indicator (customer generic table) */
  is_challenged?: boolean
  refund?: {
    refunded_amount?: number
  }
  is_flagged?: boolean
  /** Public URL when API exposes it (some list payloads omit this). */
  c88DocumentUrl?: string
  /** Recovery list/detail: C88 stored in S3 — presence means a C88 document exists. */
  c88S3Key?: string | null
  c88Filename?: string | null
  c88Bucket?: string | null
  c88Items?: RecoveryShipmentItem[]
  screeningStatus?: string
  sanctionsScreeningStatus?: string
  sanctionDecision?: string
  userName?: string
  userFullName?: string
  userEmail?: string
  recoveryUser?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  vendorId?: string
  vendor?: RecoveryShipmentParty & {
    sanctionDetails?: {
      highestRiskLevel?: string
      allMatches?: unknown[]
    }
  }
  sanctionsMatch?: unknown
}

export type RecoveryShipmentsListContent = {
  data?: RecoveryShipmentRecord[]
  shipments?: RecoveryShipmentRecord[]
  page?: number
  pageSize?: number
  limit?: number
  totalPages?: number
  totalRecords?: number
  total?: number
}

export type RecoveryShipmentsListQuery = {
  page?: number
  limit?: number
  pageSize?: number
  messageId?: string
  shipmentKey?: string
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  flaggedItem?: boolean
  refundStatus?: string
}

export type RecoveryShipmentsListEnvelope = RecoveryApiEnvelope<RecoveryShipmentsListContent>

export type RecoveryShipmentParty = {
  companyName?: string
  industryType?: string
  companyWebsite?: string
  website?: string
  address1?: string
  address2?: string
  country?: string
  city?: string
  postalCode?: string
  phoneNumber?: string
  fax?: string
}

export type RecoveryShipmentItem = {
  _id?: string
  id?: string
  itemNumber?: string
  description?: string
  qty?: number
  unitPrice?: number
  hsCode?: string
  duty?: number
  dutyAmount?: number
  dutyRate?: number
  totalPrice?: number
  Total?: number
  landedCost?: number
  currency?: string | null
  flagged?: boolean
  isFlagged?: boolean
  is_flagged?: number
  reason?: string
  item_reason?: string
  source?: string
  shipment?: string
  shipment_id?: string
}

export type RecoveryShipmentDetail = RecoveryShipmentRecord & {
  requisitioner?: string
  shippingTerms?: string
  user?: string
  unit?: string
  refundStatus?: RecoveryRefundStatusCode
  poDocumentUrl?: string
  /** Recovery detail: PO stored in S3 — presence means a PO document exists. */
  poS3Key?: string | null
  poFilename?: string | null
  poBucket?: string | null
  additionalDocuments?: string[]
  company?: RecoveryShipmentParty
  vendor?: RecoveryShipmentParty
  shipTo?: RecoveryShipmentParty
  items?: RecoveryShipmentItem[]
  poItems?: RecoveryShipmentItem[]
  c88Items?: RecoveryShipmentItem[]
  shipmentReference?: string
  sourceShipmentId?: string
}

export type RecoveryShipmentDetailEnvelope = RecoveryApiEnvelope<RecoveryShipmentDetail>

export type RecoveryShipmentLandedCostContent = {
  landed_cost?: Array<[RecoveryShipmentItem, RecoveryShipmentItem]>
  total_estimated_landed_cost?: number
  total_actual_landed_cost?: number
  total_landed_cost_difference?: number
  status?: RecoveryShipmentStatusCode
  c88Currency?: string | null
  c88unit?: string
  unit?: string
  refund_status?: RecoveryRefundStatusCode
}

export type RecoveryShipmentLandedCostEnvelope =
  RecoveryApiEnvelope<RecoveryShipmentLandedCostContent>

export type RecoveryShipmentLogEvent = {
  _id: string
  title: string
  description: string | Record<string, unknown> | unknown[]
  userId?: string
  logType?: string
  time: string
  color: string
  details?: string | Record<string, unknown> | unknown[]
}

export type RecoveryShipmentLogDayGroup = {
  date: string
  events: RecoveryShipmentLogEvent[]
}

export type RecoveryShipmentLogsContent = {
  logs?: RecoveryShipmentLogDayGroup[]
  pagination?: {
    totalPages?: number
    page?: number
    limit?: number
    total?: number
  }
  ShipmentName?: string
}

export type RecoveryShipmentLogsQuery = {
  id: string
  page?: number
  limit?: number
  search?: string
}

export type RecoveryShipmentLogsEnvelope = RecoveryApiEnvelope<RecoveryShipmentLogsContent>

export type RecoveryShipmentDownloadFileType = 'c88' | 'po' | 'both'

export type RecoveryShipmentDownloadFile = {
  type: RecoveryShipmentDownloadFileType
  downloadUrl?: string
  bucket?: string
  key?: string
  fileName?: string
  expiresIn?: number
}

export type RecoveryShipmentDownloadContent = {
  shipmentId: string
  files: RecoveryShipmentDownloadFile[]
}

export type RecoveryShipmentDownloadEnvelope = RecoveryApiEnvelope<RecoveryShipmentDownloadContent>

export type RecoveryShipmentDownloadRequest = {
  id: string
  fileType?: RecoveryShipmentDownloadFileType
  expiresIn?: number
}
