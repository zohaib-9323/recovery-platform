import type { RecoveryApiEnvelope } from '@/types/recovery-user-api'

export type RecoveryShipmentStatusCode = number | string
export type RecoveryRefundStatusCode = number | string

export type RecoveryShipmentRecord = {
  _id: string
  shipmentTitle?: string
  shipmentReference?: string
  purchaseOrderNumber?: string
  date?: string
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
  landedCost?: number
  flagged?: boolean
  isFlagged?: boolean
}

export type RecoveryShipmentDetail = RecoveryShipmentRecord & {
  requisitioner?: string
  shippingTerms?: string
  user?: string
  unit?: string
  poDocumentUrl?: string
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
