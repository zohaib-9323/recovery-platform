export type SanctionDecision = 'stopped' | 'ignored' | 'none' | string | null | undefined

export type SanctionScreeningShipment = {
  screeningStatus?: string
  sanctionsScreeningStatus?: string
  sanctionDecision?: SanctionDecision
}

export function hasSanctionMatch(shipment?: SanctionScreeningShipment | null): boolean {
  if (!shipment) return false
  return (
    shipment.screeningStatus === 'match_found' ||
    shipment.sanctionsScreeningStatus === 'match_found'
  )
}

export function normalizeSanctionDecision(
  decision?: SanctionDecision,
): 'none' | 'stopped' | 'ignored' {
  if (decision === 'stopped' || decision === 'ignored') return decision
  return 'none'
}

/** Blocks view / C88 until user ignores, or while processing is explicitly stopped. */
export function blocksSanctionProcessing(decision?: SanctionDecision): boolean {
  const normalized = normalizeSanctionDecision(decision)
  return normalized === 'none' || normalized === 'stopped'
}

export function needsSanctionDecision(shipment?: SanctionScreeningShipment | null): boolean {
  return hasSanctionMatch(shipment) && blocksSanctionProcessing(shipment?.sanctionDecision)
}

export function canOpenSanctionModal(shipment?: SanctionScreeningShipment | null): boolean {
  if (!hasSanctionMatch(shipment)) return false
  const decision = normalizeSanctionDecision(shipment?.sanctionDecision)
  return decision === 'none' || decision === 'stopped'
}

export function isSanctionStopped(decision?: SanctionDecision): boolean {
  return normalizeSanctionDecision(decision) === 'stopped'
}

export function isSanctionIgnored(decision?: SanctionDecision): boolean {
  return normalizeSanctionDecision(decision) === 'ignored'
}

/** UI-only status code when sanctionDecision is stopped (not stored on shipment.status). */
export const SANCTION_STOPPED_DISPLAY_STATUS = 10

/** Maps API status to list/detail label; stopped overrides regardless of shipment.status. */
export function resolveShipmentStatusForDisplay(
  status: number,
  sanctionDecision?: SanctionDecision,
): number {
  if (isSanctionStopped(sanctionDecision)) {
    return SANCTION_STOPPED_DISPLAY_STATUS
  }
  return status
}
