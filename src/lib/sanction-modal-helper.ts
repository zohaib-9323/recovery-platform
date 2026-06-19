export type SanctionMatch = {
  listName: string
  entityName: string
  score: number
  matchId: string
  entityDetails: Record<string, unknown>
}

export type SanctionShipmentSource = {
  _id?: string
  shipmentTitle?: string
  vendorId?: string
  vendor?: {
    companyName?: string
    address1?: string
    address2?: string
    city?: string
    country?: string
    sanctionDetails?: {
      highestRiskLevel?: string
      allMatches?: unknown[]
    }
  }
  sanctionsMatch?: unknown
}

export function buildSanctionModalProps(shipment: SanctionShipmentSource) {
  const vendor = shipment.vendor
  const matches = (vendor?.sanctionDetails?.allMatches ||
    (shipment.sanctionsMatch ? [shipment.sanctionsMatch] : [])) as Record<string, unknown>[]

  const sanctionsData: SanctionMatch[] = matches.map((match) => ({
    listName: (match.listSource as string) || (match.source as string) || 'Unknown',
    entityName: (match.sanctionName as string) || (match.name as string) || 'Unknown Entity',
    score: (match.confidence as number) || (match.riskScore as number) || 0,
    matchId: (match.sanctionId as string) || String(Math.random()),
    entityDetails: match,
  }))

  return {
    shipmentTitle: shipment.shipmentTitle || 'Unknown Shipment',
    vendorName: vendor?.companyName || shipment.vendorId || 'Unknown Vendor',
    vendorAddress: vendor
      ? `${vendor.address1 || ''}${vendor.address2 ? `, ${vendor.address2}` : ''} ${vendor.city || ''}, ${vendor.country || ''}`.trim()
      : 'Unknown Address',
    riskLevel: vendor?.sanctionDetails?.highestRiskLevel || 'Unknown',
    sanctionsData,
  }
}
