/**
 * Maps recovery API shipment `status` (string or number) to the same numeric codes
 * as trade-harmonizer admin (`mapRecoveryStatusToLegacy`).
 */
export function mapRecoveryStatusToLegacy(status: unknown): number {
  if (typeof status === 'number' && Number.isFinite(status)) return status
  const normalizedStatus = String(status ?? '')
    .toLowerCase()
    .trim()

  switch (normalizedStatus) {
    case '1':
    case 'hs_code_processing':
    case 'submitted':
    case 'in_review':
    case 'inreview':
      return 1
    case '2':
    case 'c88_upload_pending':
      return 2
    case '3':
    case 'processing':
      return 3
    case '4':
    case 'pending':
      return 4
    case '5':
    case 'successful':
    case 'success':
    case 'completed':
    case 'approved':
      return 5
    case '6':
    case 'cancelled':
    case 'canceled':
    case 'rejected':
    case 'failed':
    case 'error':
      return 6
    case '7':
    case 'challenged':
    case 'hs_code_challenged':
      return 7
    case '8':
    case 'item_mapping_failed':
      return 8
    case '9':
    case 'discrepancies':
    case 'discrepancy':
    case 'cost_discrepancy':
      return 9
    default:
      return 3
  }
}
