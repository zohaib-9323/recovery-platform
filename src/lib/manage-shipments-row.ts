import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'
import type { ManageShipmentsTableRow } from '@/pages/(dashboard)/shipments/components/all-shipments-data-table'
import type { RecoveryShipmentRecord } from '@/types/recovery-shipments-api'

/**
 * Maps an API shipment record onto the row shape `AllShipmentsDataTable` renders.
 *
 * Lives here rather than beside one page because three screens render that same
 * table against the same endpoint — All Shipments, the dashboard's recent list,
 * and the Imports section's processed-shipments list. Copies of this mapping
 * drift silently: a field added for one screen's action (a sanction decision, a
 * refund amount) simply goes missing on the others, and the table renders
 * without it rather than failing.
 */
function toNumericRefundStatus(s: RecoveryShipmentRecord): number | undefined {
  const raw = s.refund_status ?? s.refundStatus
  if (raw === undefined || raw === null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/** Recovery list payloads often omit `c88DocumentUrl` but include S3 key / filename / items. */
function recoveryListShipmentHasC88Document(shipment: RecoveryShipmentRecord): boolean {
  const url = shipment.c88DocumentUrl
  if (url !== null && url !== undefined && String(url).trim() !== '') {
    return true
  }
  const key = shipment.c88S3Key
  if (key !== null && key !== undefined && String(key).trim() !== '') {
    return true
  }
  const name = shipment.c88Filename
  if (name !== null && name !== undefined && String(name).trim() !== '') {
    return true
  }
  const items = shipment.c88Items
  if (Array.isArray(items) && items.length > 0) {
    return true
  }
  return false
}

export function toManageShipmentsTableRow(
  shipment: RecoveryShipmentRecord,
): ManageShipmentsTableRow {
  const status = mapRecoveryStatusToLegacy(shipment.status)
  const refund_status = toNumericRefundStatus(shipment)
  const c88Raw = shipment.c88DocumentUrl
  const trimmed = c88Raw === null || c88Raw === undefined ? '' : String(c88Raw).trim()
  const c88DocumentUrl = trimmed === '' ? '' : trimmed
  const hasC88Document = recoveryListShipmentHasC88Document(shipment)
  const fnRaw = shipment.c88Filename
  const c88Filename =
    fnRaw === null || fnRaw === undefined ? undefined : String(fnRaw).trim() || undefined

  return {
    _id: shipment._id,
    shipmentTitle: shipment.shipmentTitle || shipment.shipmentReference || 'Untitled Shipment',
    dateRaw: shipment.date,
    createdAtRaw: shipment.createdAt,
    shipVia: shipment.shipVia || '',
    purchaseOrderNumber: shipment.purchaseOrderNumber || '',
    status,
    refund_status,
    refunded_amount: shipment.refund?.refunded_amount,
    c88DocumentUrl,
    hasC88Document,
    c88Filename,
    screeningStatus: shipment.screeningStatus,
    sanctionsScreeningStatus: shipment.sanctionsScreeningStatus,
    sanctionDecision: shipment.sanctionDecision,
    is_flagged: shipment.is_flagged,
    is_challenged: shipment.is_challenged,
    vendor: shipment.vendor,
    vendorId: shipment.vendorId,
    sanctionsMatch: shipment.sanctionsMatch,
  }
}
