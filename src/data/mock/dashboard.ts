export type KpiStat = {
  id: string
  label: string
  value: string
  hint: string
  trend: 'up' | 'down' | 'none'
  /** Status row: green dot + hint (e.g. “5 new today”) when `trend` is `none`. */
  hintTone?: 'success'
}

export const overviewKpis: KpiStat[] = [
  {
    id: 'emails',
    label: 'Emails Received',
    value: '8,774',
    hint: '• 5 new today',
    trend: 'none',
    hintTone: 'success',
  },
  {
    id: 'created',
    label: 'Shipments Created',
    value: '10,066',
    hint: '+30.01%',
    trend: 'up',
  },
  {
    id: 'active',
    label: 'Active Shipments',
    value: '106',
    hint: '+30.01%',
    trend: 'up',
  },
  {
    id: 'files',
    label: 'Files Processed',
    value: '36,520',
    hint: '+30.01%',
    trend: 'up',
  },
]

export type ShipmentRow = {
  id: string
  username?: string
  title: string
  date: string
  po: string
  shipVia: string
  status?: 'submitted' | 'in_review' | 'approved' | 'rejected'
  refundStatus?: 'not_requested' | 'requested' | 'processing' | 'refunded'
  statusCode?: number
  refundStatusCode?: number
  c88DocumentUrl?: string
  screeningStatus?: string
  sanctionsScreeningStatus?: string
  sanctionDecision?: string
  isFlagged?: boolean
}

export const latestShipments: ShipmentRow[] = [
  { id: '1', title: 'Container #1', date: 'Mar 1, 2025', po: 'TML475762', shipVia: 'Sea' },
  { id: '2', title: 'Air freight batch A', date: 'Feb 28, 2025', po: 'TML475801', shipVia: 'Air' },
  { id: '3', title: 'LCL consolidation', date: 'Feb 26, 2025', po: 'TML475812', shipVia: 'Sea' },
  { id: '4', title: 'Express documents', date: 'Feb 25, 2025', po: 'TML475820', shipVia: 'Air' },
  { id: '5', title: 'Reefer shipment #12', date: 'Feb 24, 2025', po: 'TML475833', shipVia: 'Sea' },
  { id: '6', title: 'Bulk grain lot', date: 'Feb 22, 2025', po: 'TML475840', shipVia: 'Sea' },
]
