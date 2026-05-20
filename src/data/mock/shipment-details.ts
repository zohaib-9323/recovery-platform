import type { ShipmentRow } from '@/data/mock/dashboard'
import { allShipmentsRows } from '@/data/mock/all-shipments'

export type ShipmentItem = {
  id: string
  itemNumber: string
  description: string
  qty: number
  unitPrice: number
  hsCode: string
  duty: number
  landedCost: number
  flagged?: boolean
}

export type ShipmentDetail = {
  id: string
  shipment: ShipmentRow
  requisitioner: string
  shippingTerms: string
  company: {
    name: string
    industry: string
    website: string
    address1: string
    city: string
    country: string
  }
  vendor: {
    name: string
    website: string
    city: string
    country: string
  }
  shipTo: {
    name: string
    website: string
    city: string
    country: string
  }
  items: ShipmentItem[]
}

const detailById: Record<string, Omit<ShipmentDetail, 'shipment' | 'id'>> = {
  '1': {
    requisitioner: 'Alex Morgan',
    shippingTerms: 'FOB',
    company: {
      name: 'TradeOps Ltd',
      industry: 'Logistics',
      website: 'https://tradeops.example.com',
      address1: '1 Harbor St',
      city: 'London',
      country: 'UK',
    },
    vendor: {
      name: 'Global Vendor Inc',
      website: 'https://vendor.example.com',
      city: 'Rotterdam',
      country: 'NL',
    },
    shipTo: {
      name: 'North Port WH',
      website: 'https://northport.example.com',
      city: 'Liverpool',
      country: 'UK',
    },
    items: [
      {
        id: 'i1',
        itemNumber: '1001',
        description: 'Industrial sensor pack',
        qty: 10,
        unitPrice: 24,
        hsCode: '9031.80',
        duty: 18,
        landedCost: 258,
      },
      {
        id: 'i2',
        itemNumber: '1002',
        description: 'Control module set',
        qty: 4,
        unitPrice: 85,
        hsCode: '8537.10',
        duty: 26,
        landedCost: 366,
        flagged: true,
      },
    ],
  },
}

function fallbackForShipment(shipment: ShipmentRow): ShipmentDetail {
  return {
    id: shipment.id,
    shipment,
    requisitioner: shipment.username ?? 'Unknown',
    shippingTerms: 'CIF',
    company: {
      name: 'Recovery Platform Co',
      industry: 'Trade',
      website: 'https://recovery.example.com',
      address1: '22 Dock Road',
      city: 'London',
      country: 'UK',
    },
    vendor: {
      name: 'Vendor House',
      website: 'https://vendorhouse.example.com',
      city: 'Hamburg',
      country: 'DE',
    },
    shipTo: {
      name: 'Main Warehouse',
      website: 'https://warehouse.example.com',
      city: 'Manchester',
      country: 'UK',
    },
    items: [
      {
        id: `${shipment.id}-i1`,
        itemNumber: '2001',
        description: `${shipment.title} - line item`,
        qty: 5,
        unitPrice: 40,
        hsCode: '8471.30',
        duty: 20,
        landedCost: 220,
      },
    ],
  }
}

export function getMockShipmentDetail(id: string): ShipmentDetail | null {
  const shipment = allShipmentsRows.find((row) => row.id === id)
  if (!shipment) return null
  const specific = detailById[id]
  if (!specific) return fallbackForShipment(shipment)
  return { id, shipment, ...specific }
}
