import type { ShipmentRow } from '@/data/mock/dashboard'

/** Full list for All Shipments page (dates as M/D/YYYY). */
export const allShipmentsRows: ShipmentRow[] = [
  { id: '1', title: 'Container #1', date: '1/31/2025', po: 'TML42666', shipVia: 'Sea' },
  { id: '2', title: 'Container #2', date: '1/30/2025', po: 'TML42667', shipVia: 'Sea' },
  { id: '3', title: 'Container #3', date: '1/29/2025', po: 'TML42668', shipVia: 'Air' },
  { id: '4', title: 'Container #4', date: '1/28/2025', po: 'TML42669', shipVia: 'Sea' },
  { id: '5', title: 'Container #5', date: '1/27/2025', po: 'TML42670', shipVia: 'Air' },
  { id: '6', title: 'Container #6', date: '1/26/2025', po: 'TML42671', shipVia: 'Sea' },
  { id: '7', title: 'Container #7', date: '1/25/2025', po: 'TML42672', shipVia: 'Sea' },
  { id: '8', title: 'Container #8', date: '1/24/2025', po: 'TML42673', shipVia: 'Air' },
  { id: '9', title: 'Container #9', date: '1/23/2025', po: 'TML42674', shipVia: 'Sea' },
  { id: '10', title: 'Container #10', date: '1/22/2025', po: 'TML42675', shipVia: 'Sea' },
  { id: '11', title: 'Air freight batch A', date: '1/21/2025', po: 'TML42676', shipVia: 'Air' },
  { id: '12', title: 'LCL consolidation', date: '1/20/2025', po: 'TML42677', shipVia: 'Sea' },
]
