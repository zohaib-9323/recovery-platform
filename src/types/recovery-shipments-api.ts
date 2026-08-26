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
  /** Restrict to shipments produced by a mailbox import. Ignored when messageId is set. */
  source?: 'm365-import'
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

/** Required-document entry for a preferential trade agreement (rules-of-origin proof). */
export type RecoveryTradeLookupDocument = {
  document_code?: string
  certificate_description?: string
  guidance_cds?: string
}

/** A single duty measure (standard/MFN or a preferential agreement) from the live
 *  UK Trade Tariff lookup, as returned by `GET /recovery/shipments/:id/preferential-duty`. */
export type RecoveryTradeLookupAgreement = {
  agreement_name?: string
  duty?: string
  duty_is_compound?: boolean
  measure_id?: string
  measure_type?: string
  geographical_area?: string
  documents_required?: RecoveryTradeLookupDocument[]
  documents_loading?: boolean
}

/** Trade-lookup snapshot for one HS code + origin country pair. Mirrors trade-harmonizer's
 *  `TradeLookupResponse` (see `trade-harmony.ts`) — either fetched live via the preferential-duty
 *  endpoint, or persisted onto a poItems[] entry once an HS code challenge is approved. */
export type RecoveryTradeLookupResponse = {
  hs_code?: string
  commodity_code?: string
  description?: string
  origin?: string
  standard_duty?: RecoveryTradeLookupAgreement
  agreements?: RecoveryTradeLookupAgreement[]
  lowest_duty?: RecoveryTradeLookupAgreement
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
  /** Set when this poItems[] entry has a pending HS code challenge. */
  is_challenged?: boolean
  challengeData?: {
    _id?: string
    proposedHsCode?: string
    reason?: string
    description?: string
    status?: string
  }
  /** Persisted trade-lookup snapshot — only populated once a challenge on this item has been
   *  approved. Most items won't carry this; use `getRecoveryPreferentialDuty` for a live lookup. */
  tradeAgreement?: RecoveryTradeLookupResponse | null
  /** This item's position in the shipment's `poItems[]` array — the id `getRecoveryPreferentialDuty`
   *  needs. Set by `ShipmentDetailPageV2` when normalizing items; not part of the API response. */
  poItemIndex?: number
}

/** Single-item shape of `GET /recovery/shipments/:id/preferential-duty?itemIndex=N`. */
export type RecoveryPreferentialDutyItem = {
  itemIndex: number
  itemNumber?: string | null
  description?: string | null
  hsCode?: string | null
  dutyRate?: number | null
  dutyAmount?: number | null
  landedCost?: number | null
  tradeLookup?: RecoveryTradeLookupResponse | null
  existingTradeAgreement?: RecoveryTradeLookupResponse | null
}

/** Response of `GET /recovery/shipments/:id/preferential-duty`. When called with an
 *  `itemIndex` query param, the single-item fields are populated; without it, `items[]`
 *  carries the same shape for every poItems[] entry. */
export type RecoveryPreferentialDutyContent = RecoveryPreferentialDutyItem & {
  shipmentId: string
  originCountryCode?: string
  items?: RecoveryPreferentialDutyItem[]
}

export type RecoveryPreferentialDutyEnvelope = RecoveryApiEnvelope<RecoveryPreferentialDutyContent>

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
