import { fireEvent, render, screen } from '@testing-library/react'

import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { InboxUnprocessedShipmentsTable } from './inbox-unprocessed-shipments-table'

/**
 * Covers Phase 4's Retry UI: the per-row "Retry" action menu item and the
 * bulk "Retry All" button, including their busy/disabled interplay with the
 * pre-existing "Convert to processable" action on the same row.
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
  it('renders the empty state and no Retry All button when there are no rows', () => {
    render(<InboxUnprocessedShipmentsTable rows={[]} onRetryAll={jest.fn()} />)

    expect(
      screen.getByText('No unprocessable shipments available for this message.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry All' })).not.toBeInTheDocument()
  })

  it('does not render the Retry All button when onRetryAll is not provided', () => {
    render(<InboxUnprocessedShipmentsTable rows={[ROW_A]} />)

    expect(screen.queryByRole('button', { name: 'Retry All' })).not.toBeInTheDocument()
  })

  it('calls onRetryAll when the bulk button is clicked, and shows the in-flight label', () => {
    const onRetryAll = jest.fn()
    const { rerender } = render(
      <InboxUnprocessedShipmentsTable rows={[ROW_A, ROW_B]} onRetryAll={onRetryAll} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retry All' }))
    expect(onRetryAll).toHaveBeenCalledTimes(1)

    rerender(
      <InboxUnprocessedShipmentsTable
        rows={[ROW_A, ROW_B]}
        onRetryAll={onRetryAll}
        isRetryingAll
      />,
    )
    expect(screen.getByRole('button', { name: 'Retrying All...' })).toBeDisabled()
  })

  it('calls onRetry with the clicked row from its action menu', () => {
    const onRetry = jest.fn()
    render(
      <InboxUnprocessedShipmentsTable
        rows={[ROW_A, ROW_B]}
        onRetry={onRetry}
        onRetryAll={jest.fn()}
      />,
    )

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

  it('disables every row action while a bulk Retry All is in flight', () => {
    render(
      <InboxUnprocessedShipmentsTable
        rows={[ROW_A, ROW_B]}
        onRetry={jest.fn()}
        onRetryAll={jest.fn()}
        isRetryingAll
      />,
    )

    const rowA = screen.getByText('a.pdf').closest('tr')!
    expect(rowA.querySelector('button')).toBeDisabled()
    const rowB = screen.getByText('b.pdf').closest('tr')!
    expect(rowB.querySelector('button')).toBeDisabled()

    expect(screen.getByRole('button', { name: 'Retrying All...' })).toBeDisabled()
  })
})
