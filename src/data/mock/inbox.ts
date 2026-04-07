export type InboxAttachment = {
  id: string
  name: string
  size: string
  status: 'passed' | 'failed' | 'pending'
}

export type InboxShipmentRow = {
  id: string
  title: string
  date: string
  shipVia: string
  po: string
}

export type InboxEmail = {
  id: string
  sender: string
  subject: string
  receivedLabel: string
  fileCount: number
  fromAddress: string
  domain: string
  receivedDetail: string
  tenant: string
  tenantReceivedAt: string
  attachments: InboxAttachment[]
  shipments: InboxShipmentRow[]
}

export const inboxEmails: InboxEmail[] = [
  {
    id: '1',
    sender: 'logistics@supplier.com',
    subject: 'Invoice and packing slip',
    receivedLabel: '2024-01-15 12:15',
    fileCount: 3,
    fromAddress: 'docs@partner.co.uk',
    domain: 'partner.co.uk',
    receivedDetail: '2024-01-15 12:15',
    tenant: 'Alpha Logistics',
    tenantReceivedAt: '26 Mar 2026, 10:24:13',
    attachments: [
      { id: 'a1', name: 'invoice_JAN2024.pdf', size: '240 KB', status: 'passed' },
      { id: 'a2', name: 'packing_list.xlsx', size: '88 KB', status: 'passed' },
      { id: 'a3', name: 'bol_scan.pdf', size: '1.2 MB', status: 'passed' },
    ],
    shipments: [
      {
        id: 's1',
        title: 'Container #1',
        date: '1/31/2025',
        shipVia: 'Sea',
        po: 'TML42666',
      },
    ],
  },
  {
    id: '2',
    sender: 'carrier@freight.io',
    subject: 'Booking confirmation BKG-9021',
    receivedLabel: '2024-01-14 09:02',
    fileCount: 1,
    fromAddress: 'ops@freight.io',
    domain: 'freight.io',
    receivedDetail: '2024-01-14 09:02',
    tenant: 'Alpha Logistics',
    tenantReceivedAt: '25 Mar 2026, 14:10:00',
    attachments: [{ id: 'b1', name: 'booking.pdf', size: '120 KB', status: 'passed' }],
    shipments: [],
  },
  {
    id: '3',
    sender: 'customs@port.gov',
    subject: 'Document review required',
    receivedLabel: '2024-01-13 16:40',
    fileCount: 2,
    fromAddress: 'noreply@port.gov',
    domain: 'port.gov',
    receivedDetail: '2024-01-13 16:40',
    tenant: 'Alpha Logistics',
    tenantReceivedAt: '24 Mar 2026, 08:15:22',
    attachments: [
      { id: 'c1', name: 'declaration.pdf', size: '340 KB', status: 'pending' },
      { id: 'c2', name: 'photos.zip', size: '4.1 MB', status: 'failed' },
    ],
    shipments: [
      {
        id: 's2',
        title: 'Air Freight #AF-12',
        date: '2/1/2025',
        shipVia: 'Air',
        po: 'PO-77821',
      },
    ],
  },
  {
    id: '4',
    sender: 'docs@partner.co.uk',
    subject: 'Re: Invoice and packing slip',
    receivedLabel: '2024-01-12 11:22',
    fileCount: 0,
    fromAddress: 'docs@partner.co.uk',
    domain: 'partner.co.uk',
    receivedDetail: '2024-01-12 11:22',
    tenant: 'Alpha Logistics',
    tenantReceivedAt: '23 Mar 2026, 10:00:00',
    attachments: [],
    shipments: [],
  },
]
