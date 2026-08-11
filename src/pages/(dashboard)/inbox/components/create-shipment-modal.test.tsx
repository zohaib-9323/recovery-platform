import { fireEvent, render, screen } from '@testing-library/react'

import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { CreateShipmentModal } from './create-shipment-modal'

/**
 * Covers the manual Create Shipment modal: mutual-exclusion dropdowns, s3Key-based row
 * filtering (an item without a persisted s3Key can't satisfy the backend's required
 * ciS3Key/c88S3Key, so it's hidden entirely), and the client-side validation that
 * mirrors the backend's checks.
 *
 * The modal no longer fires the mutation itself — see docs/retry-and-manual-shipment-creation.md
 * for why (closing immediately and running the request in the background from
 * `InboxDetailPanel` so it survives the modal unmounting). On a valid submit it just
 * calls `onSubmit` with the resolved rows and closes; the mutation call, toast, and
 * refetch are `InboxDetailPanel`'s responsibility, not tested here.
 */

const CI_ROW: InboxUnprocessedShipmentRow = {
  id: 'row-0',
  sourceIndex: 0,
  fileName: 'ci.pdf',
  type: 'UNKNOWN',
  status: 'Failed',
  s3Key: 'accepted/doc/mid/unprocessable/ci.pdf',
}

const C88_ROW: InboxUnprocessedShipmentRow = {
  id: 'row-1',
  sourceIndex: 1,
  fileName: 'c88.pdf',
  type: 'UNKNOWN',
  status: 'Failed',
  s3Key: 'accepted/doc/mid/unprocessable/c88.pdf',
}

const STALE_ROW_NO_S3_KEY: InboxUnprocessedShipmentRow = {
  id: 'row-2',
  sourceIndex: 2,
  fileName: 'legacy.pdf',
  type: 'UNKNOWN',
  status: 'Failed',
}

describe('CreateShipmentModal', () => {
  it('rejects submission when the title is blank, without calling onSubmit', () => {
    const onSubmit = jest.fn()
    render(<CreateShipmentModal rows={[CI_ROW, C88_ROW]} onClose={jest.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    expect(screen.getByText('Shipment title is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects submission when only one of CI/C88 is selected', () => {
    const onSubmit = jest.fn()
    render(<CreateShipmentModal rows={[CI_ROW, C88_ROW]} onClose={jest.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Shipment Title/), {
      target: { value: 'August Batch' },
    })
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    expect(screen.getByText('Select both a CI and a C88 document.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables the currently-selected CI option inside the C88 dropdown (mutual exclusion)', () => {
    render(
      <CreateShipmentModal rows={[CI_ROW, C88_ROW]} onClose={jest.fn()} onSubmit={jest.fn()} />,
    )

    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })

    const c88Select = screen.getByLabelText(/C88 Document/) as HTMLSelectElement
    const ciOptionInC88Select = Array.from(c88Select.options).find((option) => option.value === '0')
    expect(ciOptionInC88Select?.disabled).toBe(true)
  })

  it('filters out rows without a persisted s3Key and shows the hidden-rows notice', () => {
    render(
      <CreateShipmentModal
        rows={[CI_ROW, C88_ROW, STALE_ROW_NO_S3_KEY]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />,
    )

    const ciSelect = screen.getByLabelText(/CI Document/) as HTMLSelectElement
    const optionLabels = Array.from(ciSelect.options).map((o) => o.textContent)
    expect(optionLabels).not.toContain('legacy.pdf')
    expect(
      screen.getByText(
        "Some files can't be selected here because they're missing required data — try refreshing the inbox.",
      ),
    ).toBeInTheDocument()
  })

  it("submits the selected CI/C88 rows and title, then closes immediately (doesn't wait for a mutation)", () => {
    const onClose = jest.fn()
    const onSubmit = jest.fn()

    render(<CreateShipmentModal rows={[CI_ROW, C88_ROW]} onClose={onClose} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Shipment Title/), {
      target: { value: '  August Batch  ' },
    })
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/C88 Document/), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'August Batch',
      ciRow: CI_ROW,
      c88Row: C88_ROW,
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the no-files-available message and disables submit when every row lacks an s3Key', () => {
    render(
      <CreateShipmentModal rows={[STALE_ROW_NO_S3_KEY]} onClose={jest.fn()} onSubmit={jest.fn()} />,
    )

    expect(screen.getByText('No unprocessable files are available to select.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Shipment' })).toBeDisabled()
  })
})
