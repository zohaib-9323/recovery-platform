import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const thCell = 'px-4 py-3 text-left text-xs font-normal text-rp-muted'
const tdCell = 'px-4 py-3 text-sm text-rp-fg'

function StatusDot({ className }: { className: string }) {
  return <span className={cn('inline-block size-1.5 rounded-full', className)} />
}

const PROCESSABLE_ROWS = [
  {
    title: 'Container #1',
    date: '1/31/2025',
    c88: 'Entry Document - 5GB5485',
    po: 'Entry Document - 5GB5485',
  },
  {
    title: 'Container #10',
    date: '14/07/2024',
    c88: 'LONBIH10013875_ICLR_MRN_LONBIH10013875_MJB.pdf',
    po: 'LONBIH10013875_ICLR_MRN_LONBIH10013875_MJB.pdf',
  },
]

const IN_PROCESSING_ROWS = [
  { title: 'Container #1', ci: 'Entry Document - 5GB5485', c88: 'Entry Document - 5GB5485' },
]

const UNPROCESSABLE_ROWS = [
  { fileName: '1.xlsx', type: 'PO', reason: 'C88 Missing' },
  { fileName: '2.xlsx', type: 'PO', reason: 'C88 Missing' },
]

function ProcessableShipmentsTable() {
  return (
    <div className="rounded-[8px] border border-rp-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-rp-surface">
          <tr className="border-b border-rp-border">
            <th className={thCell}>Shipment Title</th>
            <th className={thCell}>Date</th>
            <th className={thCell}>C88</th>
            <th className={thCell}>PO #</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rp-border">
          {PROCESSABLE_ROWS.map((row) => (
            <tr key={row.title}>
              <td className={cn(tdCell, 'font-medium')}>{row.title}</td>
              <td className={tdCell}>{row.date}</td>
              <td
                className={cn(tdCell, 'max-w-[180px] truncate text-rp-blue underline')}
                title={row.c88}
              >
                {row.c88}
              </td>
              <td
                className={cn(tdCell, 'max-w-[180px] truncate text-rp-blue underline')}
                title={row.po}
              >
                {row.po}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InProcessingShipmentsTable() {
  return (
    <div className="rounded-[8px] border border-rp-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-rp-surface">
          <tr className="border-b border-rp-border">
            <th className={thCell}>Shipment Title</th>
            <th className={thCell}>CI Document</th>
            <th className={thCell}>C88 Document</th>
            <th className={thCell}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rp-border">
          {IN_PROCESSING_ROWS.map((row) => (
            <tr key={row.title}>
              <td className={cn(tdCell, 'font-medium')}>{row.title}</td>
              <td className={cn(tdCell, 'max-w-[180px] truncate')} title={row.ci}>
                {row.ci}
              </td>
              <td className={cn(tdCell, 'max-w-[180px] truncate')} title={row.c88}>
                {row.c88}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-rp-accent/10 px-2 py-1 text-xs font-medium text-rp-accent">
                  <StatusDot className="bg-rp-accent" />
                  Processing...
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UnprocessableShipmentsTable() {
  return (
    <div className="rounded-[8px] border border-rp-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-rp-surface">
          <tr className="border-b border-rp-border">
            <th className={thCell}>File Name</th>
            <th className={thCell}>Type</th>
            <th className={thCell}>Status</th>
            <th className={cn(thCell, 'text-right')}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rp-border">
          {UNPROCESSABLE_ROWS.map((row) => (
            <tr key={row.fileName}>
              <td className={cn(tdCell, 'font-medium')}>{row.fileName}</td>
              <td className={tdCell}>{row.type}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-redOne/10 px-2 py-1 text-xs font-medium text-redOne">
                  <StatusDot className="bg-redOne" />
                  {row.reason}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  disabled
                  className="inline-flex size-6 items-center justify-center rounded-full border-[0.5px] border-rp-accent/20 bg-rp-accent/5 text-rp-accent"
                  aria-label="Row actions"
                >
                  <MoreHorizontal className="size-3" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Static preview only — the backend doesn't emit processable/in-processing/unprocessable
 * shipment data on the import-job endpoints yet. Kept behind SHOW_STATIC_SHIPMENT_SECTIONS
 * in ImportJobDetailPage until that data exists; do not wire this to real queries.
 */
export function ImportDetailStaticShipments() {
  return (
    <>
      <div className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold text-rp-heading">Processable Shipments</h2>
        <ProcessableShipmentsTable />
      </div>

      <div className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold text-rp-heading">In Processable Shipments</h2>
        <InProcessingShipmentsTable />
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-rp-heading">Unprocessable Shipments</h2>
          <Button variant="default" size="sm" disabled>
            Create Shipment
          </Button>
        </div>
        <UnprocessableShipmentsTable />
      </div>
    </>
  )
}
