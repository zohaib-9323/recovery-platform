import { fireEvent, render, screen } from '@testing-library/react'

import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { InboxUnprocessedShipmentsTable } from './inbox-unprocessed-shipments-table'

/**
 * Covers Phase 4's Retry UI: the per-row "Retry" action menu item, including
 * its busy/disabled interplay with the pre-existing "Convert to processable"
 * action on the same row. Bulk "Retry All" was removed from this
 * self-service table — that capability now lives only in the admin panel
 * (trade-harmonizer's admin-recovery-inbox detail page).
 */

const ROW_A: InboxUnprocessedShipmentRow = {
  id: 'row-a',
  sourceIndex: 0,
  fileName: 'a.pdf',
  type: 'UNKNOWN',
  status: 'Failed',
  s3Key: 'accepted/doc/mid/unprocessable/a.pdf',
}

const ROW_B: InboxUnprocessedShipmentRow = {
  id: 'row-b',
  sourceIndex: 1,
  fileName: 'b.pdf',
  type: 'UNKNOWN',
  status: 'Failed',
  s3Key: 'accepted/doc/mid/unprocessable/b.pdf',
}

function openRowMenu(rowFileName: string) {
  const row = screen.getByText(rowFileName).closest('tr')!
  const trigger = row.querySelector('button')!
  fireEvent.click(trigger)
}

describe('InboxUnprocessedShipmentsTable', () => {
  it('renders the empty state when there are no rows', () => {
    render(<InboxUnprocessedShipmentsTable rows={[]} />)

    expect(
      screen.getByText('No unprocessable shipments available for this message.'),
    ).toBeInTheDocument()
  })

  it('calls onRetry with the clicked row from its action menu', () => {
    const onRetry = jest.fn()
    render(<InboxUnprocessedShipmentsTable rows={[ROW_A, ROW_B]} onRetry={onRetry} />)

    openRowMenu('a.pdf')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledWith(ROW_A)
  })

  it('disables both actions on a row while that row is retrying, without affecting other rows', () => {
    render(
      <InboxUnprocessedShipmentsTable
        rows={[ROW_A, ROW_B]}
        onRetry={jest.fn()}
        onConvertToProcessable={jest.fn()}
        retryingIndex={0}
      />,
    )

    const rowA = screen.getByText('a.pdf').closest('tr')!
    const rowATrigger = rowA.querySelector('button')!
    expect(rowATrigger).toBeDisabled()

    const rowB = screen.getByText('b.pdf').closest('tr')!
    const rowBTrigger = rowB.querySelector('button')!
    expect(rowBTrigger).not.toBeDisabled()
  })
})
