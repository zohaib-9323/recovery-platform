import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { CreateShipmentModal } from './create-shipment-modal'

/**
 * Covers Phase 5's manual Create Shipment modal: mutual-exclusion dropdowns,
 * s3Key-based row filtering (an item without a persisted s3Key can't satisfy
 * the backend's required ciS3Key/c88S3Key, so it's hidden entirely), the
 * client-side validation that mirrors the backend's checks, and that a
 * backend error (e.g. the 409 stale-selection message) surfaces verbatim via
 * getRtkErrorMessage rather than a generic fallback.
 */

const mockCreateManualShipment = jest.fn()
const mockShowCustomToast = jest.fn()
const mockUseCreateManualShipmentMutation = jest.fn()

jest.mock('@/app/services/recoveryDocumentActionsApi', () => ({
  useCreateManualShipmentMutation: () => mockUseCreateManualShipmentMutation(),
}))

jest.mock('@/lib/showCustomToast', () => ({
  showCustomToast: (payload: unknown) => mockShowCustomToast(payload),
}))

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
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCreateManualShipmentMutation.mockReturnValue([
      mockCreateManualShipment,
      { isLoading: false },
    ])
  })

  it('rejects submission when the title is blank, without calling the mutation', () => {
    render(<CreateShipmentModal documentId="doc-1" rows={[CI_ROW, C88_ROW]} onClose={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    expect(screen.getByText('Shipment title is required.')).toBeInTheDocument()
    expect(mockCreateManualShipment).not.toHaveBeenCalled()
  })

  it('rejects submission when only one of CI/C88 is selected', () => {
    render(<CreateShipmentModal documentId="doc-1" rows={[CI_ROW, C88_ROW]} onClose={jest.fn()} />)

    fireEvent.change(screen.getByLabelText(/Shipment Title/), {
      target: { value: 'August Batch' },
    })
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    expect(screen.getByText('Select both a CI and a C88 document.')).toBeInTheDocument()
    expect(mockCreateManualShipment).not.toHaveBeenCalled()
  })

  it('disables the currently-selected CI option inside the C88 dropdown (mutual exclusion)', () => {
    render(<CreateShipmentModal documentId="doc-1" rows={[CI_ROW, C88_ROW]} onClose={jest.fn()} />)

    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })

    const c88Select = screen.getByLabelText(/C88 Document/) as HTMLSelectElement
    const ciOptionInC88Select = Array.from(c88Select.options).find((option) => option.value === '0')
    expect(ciOptionInC88Select?.disabled).toBe(true)
  })

  it('filters out rows without a persisted s3Key and shows the hidden-rows notice', () => {
    render(
      <CreateShipmentModal
        documentId="doc-1"
        rows={[CI_ROW, C88_ROW, STALE_ROW_NO_S3_KEY]}
        onClose={jest.fn()}
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

  it("submits with the selected rows' sourceIndex/s3Key, toasts, refetches, and closes on success", async () => {
    mockCreateManualShipment.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    const onClose = jest.fn()
    const onCreated = jest.fn().mockResolvedValue(undefined)

    render(
      <CreateShipmentModal
        documentId="doc-1"
        rows={[CI_ROW, C88_ROW]}
        onClose={onClose}
        onCreated={onCreated}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Shipment Title/), {
      target: { value: '  August Batch  ' },
    })
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/C88 Document/), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    await waitFor(() => {
      expect(mockCreateManualShipment).toHaveBeenCalledWith({
        id: 'doc-1',
        title: 'August Batch',
        ciIndex: 0,
        ciS3Key: CI_ROW.s3Key,
        c88Index: 1,
        c88S3Key: C88_ROW.s3Key,
      })
    })
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockShowCustomToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Success',
      message: 'Shipment created successfully.',
    })
  })

  it('surfaces the backend error message verbatim (e.g. a 409 stale-selection rejection) and keeps the modal open', async () => {
    mockCreateManualShipment.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { message: 'Selection is stale, refresh and try again' } }),
    })
    const onClose = jest.fn()

    render(<CreateShipmentModal documentId="doc-1" rows={[CI_ROW, C88_ROW]} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText(/Shipment Title/), {
      target: { value: 'August Batch' },
    })
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/C88 Document/), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    await waitFor(() => {
      expect(screen.getByText('Selection is stale, refresh and try again')).toBeInTheDocument()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the no-files-available message and disables submit when every row lacks an s3Key', () => {
    render(
      <CreateShipmentModal documentId="doc-1" rows={[STALE_ROW_NO_S3_KEY]} onClose={jest.fn()} />,
    )

    expect(screen.getByText('No unprocessable files are available to select.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Shipment' })).toBeDisabled()
  })
})
