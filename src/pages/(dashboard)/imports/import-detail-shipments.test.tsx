import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { RecoveryCombinedDocument } from '@/types/recovery-inbox-api'

import { ImportDetailShipments } from './import-detail-shipments'

/**
 * Covers what is specific to the IMPORT-JOB view of the shipment flow, rather
 * than re-testing the Inbox tables and modal it reuses (those have their own
 * suites):
 *
 *  - the lists are unified across every email in the job, because the endpoint
 *    returns one document for the whole job;
 *  - Retry is scoped out here, so Delete is the only row action that renders;
 *  - Create Shipment posts against the job's document id and hides the two
 *    claimed rows while the request is in flight.
 */

// `mock`-prefixed so jest.mock's factories may close over them — the factories
// are hoisted above these declarations, and jest only whitelists that name shape.
const mockCreateManualShipment = jest.fn()
const mockGetRecoveryDownloadUrl = jest.fn()
let mockQueryState: {
  data?: { content: RecoveryCombinedDocument | null }
  isFetching: boolean
  isError: boolean
}

type DeleteCall = { documentId: string; index: number; filename: string; s3Key: string | null }

// The argument tuple is declared on jest.fn rather than on an unused implementation
// parameter, so `mock.calls[0][0]` stays typed as DeleteCall without a dead binding.
const mockDeleteUnprocessedDocument = jest.fn<{ unwrap: () => Promise<unknown> }, [DeleteCall]>(
  () => ({
    unwrap: () =>
      Promise.resolve({
        content: { filename: 'x', s3ObjectDeleted: true, remainingUnprocessable: 0 },
      }),
  }),
)

jest.mock('@/app/services/recoveryM365Api', () => ({
  useGetM365ImportJobShipmentsQuery: () => ({
    ...mockQueryState,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
  useDeleteUnprocessedDocumentMutation: () => [mockDeleteUnprocessedDocument, { isLoading: false }],
}))

jest.mock('@/app/services/recoveryDocumentActionsApi', () => ({
  useCreateManualShipmentMutation: () => [mockCreateManualShipment],
}))

jest.mock('@/app/services/recoveryApi', () => ({
  useGetRecoveryDownloadUrlMutation: () => [mockGetRecoveryDownloadUrl],
}))

jest.mock('@/lib/showCustomToast', () => ({ showCustomToast: jest.fn() }))

const JOB_ID = 'job-1'
const DOCUMENT_ID = 'doc-for-job-1'

/**
 * One document standing in for a whole import job: two unprocessable files that
 * arrived in DIFFERENT emails, plus one already-paired shipment. In the Inbox
 * these two files would live on separate documents and could never appear in
 * one list — here they must.
 */
const JOB_DOCUMENT: RecoveryCombinedDocument = {
  _id: DOCUMENT_ID,
  recordType: 'processed',
  messageId: `m365-import:${JOB_ID}`,
  status: 'processed',
  subject: 'Mailbox import — Inbox',
  createdAt: '2026-08-01T10:00:00.000Z',
  processable: [
    {
      shipmentId: 'SHIP-1',
      shipmentTitle: 'Container #1',
      c88: { filename: 'entry.pdf', s3Key: 'accepted/x/c88.pdf', bucket: 'b' },
      po: { filename: 'invoice.pdf', s3Key: 'accepted/x/po.pdf', bucket: 'b' },
    },
  ] as RecoveryCombinedDocument['processable'],
  unprocessable: [
    {
      filename: 'from-email-one.pdf',
      type: 'C88',
      failureReasonCode: 'PO_MISSING',
      s3Key: 'accepted/x/unprocessable/from-email-one.pdf',
    },
    {
      filename: 'from-email-two.pdf',
      type: 'PO',
      failureReasonCode: 'C88_MISSING',
      s3Key: 'accepted/x/unprocessable/from-email-two.pdf',
    },
  ] as RecoveryCombinedDocument['unprocessable'],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockQueryState = { data: { content: JOB_DOCUMENT }, isFetching: false, isError: false }
  // Never-resolving: the assertions are about the in-flight state.
  mockCreateManualShipment.mockReturnValue({ unwrap: () => new Promise(() => {}) })
})

describe('ImportDetailShipments', () => {
  it('tells the user shipments are pending while the job is still running', () => {
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive />)

    expect(
      screen.getByText(
        'Shipments will appear here once the import finishes and its documents have been paired.',
      ),
    ).toBeInTheDocument()
  })

  it('shows one unified list holding unprocessable files from different emails', () => {
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    expect(screen.getByText('from-email-one.pdf')).toBeInTheDocument()
    expect(screen.getByText('from-email-two.pdf')).toBeInTheDocument()
    expect(screen.getByText('Container #1')).toBeInTheDocument()
  })

  it('offers Delete but not Retry, which is not part of this view', () => {
    // Retry belongs to the Inbox, which has an endpoint for re-running a single
    // email's attachments; an import job has none, so the control would be dead.
    // Delete does apply — an import routinely pulls in files that will never be
    // part of a shipment.
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    const row = screen.getByText('from-email-one.pdf').closest('tr')!
    const buttons = Array.from(row.querySelectorAll('button'))
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(['Delete document'])
  })

  it('deletes a row with the identity it was listed with, so a stale index is caught', async () => {
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    const row = screen.getByText('from-email-one.pdf').closest('tr')!
    fireEvent.click(row.querySelector('button')!)

    // Confirmation is required: the file and its stored copy both go, for good.
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => expect(mockDeleteUnprocessedDocument).toHaveBeenCalled())
    const call = mockDeleteUnprocessedDocument.mock.calls[0][0]
    expect(call.filename).toBe('from-email-one.pdf')
    // The index is the row's position in the document's unprocessable[], and
    // filename/s3Key are echoed back so the server can reject a shifted index
    // rather than deleting whatever moved into that slot.
    expect(call.index).toBe(0)
    expect(call.s3Key).toBeTruthy()
  })

  it('hides files whose bytes were never stored', () => {
    // An import that ran against a broken S3 config still records the metadata
    // (the upload failure is deliberately non-fatal), leaving rows that can
    // never be paired because pairing re-reads each side from its s3Key.
    mockQueryState = {
      data: {
        content: {
          ...JOB_DOCUMENT,
          unprocessable: [
            ...JOB_DOCUMENT.unprocessable!,
            {
              filename: 'never-stored.pdf',
              type: 'UNKNOWN',
              failureReasonCode: 'PARSING_FAILURE',
              s3Key: null,
            },
          ] as RecoveryCombinedDocument['unprocessable'],
        },
      },
      isFetching: false,
      isError: false,
    }
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    expect(screen.queryByText('never-stored.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('from-email-one.pdf')).toBeInTheDocument()
    expect(screen.getByText('from-email-two.pdf')).toBeInTheDocument()
  })

  it('keeps each surviving row addressed by its ORIGINAL index when one is hidden', async () => {
    // The unstored file sits FIRST, so a filter applied before sourceIndex was
    // assigned would renumber the two real files to 0 and 1 — and Create
    // Shipment would then pair the wrong documents while looking correct.
    mockQueryState = {
      data: {
        content: {
          ...JOB_DOCUMENT,
          unprocessable: [
            {
              filename: 'never-stored.pdf',
              type: 'UNKNOWN',
              failureReasonCode: 'PARSING_FAILURE',
              s3Key: null,
            },
            ...JOB_DOCUMENT.unprocessable!,
          ] as RecoveryCombinedDocument['unprocessable'],
        },
      },
      isFetching: false,
      isError: false,
    }
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))
    fireEvent.change(screen.getByLabelText(/Shipment Title/), { target: { value: 'Manual pair' } })
    // Option values are sourceIndex: the real files are now at 1 and 2.
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/C88 Document/), { target: { value: '1' } })
    const createButtons = screen.getAllByRole('button', { name: 'Create Shipment' })
    fireEvent.click(createButtons[createButtons.length - 1])

    await waitFor(() => expect(mockCreateManualShipment).toHaveBeenCalled())
    expect(mockCreateManualShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        ciIndex: 2,
        ciS3Key: 'accepted/x/unprocessable/from-email-two.pdf',
        c88Index: 1,
        c88S3Key: 'accepted/x/unprocessable/from-email-one.pdf',
      }),
    )
  })

  it('renders the empty state when the job produced nothing to pair', () => {
    mockQueryState = { data: { content: null }, isFetching: false, isError: false }
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    expect(
      screen.getByText('This import produced no shipment documents to pair.'),
    ).toBeInTheDocument()
  })

  it('submits Create Shipment against the job document and hides the claimed rows', async () => {
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create Shipment' }))

    fireEvent.change(screen.getByLabelText(/Shipment Title/), {
      target: { value: 'Manual pair' },
    })
    fireEvent.change(screen.getByLabelText(/CI Document/), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/C88 Document/), { target: { value: '0' } })
    // Two buttons share this label once the modal is open — the section trigger
    // that opened it, and the modal's own submit. The submit is the later one.
    const createButtons = screen.getAllByRole('button', { name: 'Create Shipment' })
    fireEvent.click(createButtons[createButtons.length - 1])

    await waitFor(() => expect(mockCreateManualShipment).toHaveBeenCalled())
    expect(mockCreateManualShipment).toHaveBeenCalledWith({
      id: DOCUMENT_ID,
      title: 'Manual pair',
      ciIndex: 1,
      ciS3Key: 'accepted/x/unprocessable/from-email-two.pdf',
      c88Index: 0,
      c88S3Key: 'accepted/x/unprocessable/from-email-one.pdf',
    })

    // Both rows are claimed by the in-flight request, so the unprocessable list
    // empties out and an In Processing row takes their place. The filenames are
    // still on screen — in that new row — so the check is that the unprocessable
    // table is empty, not that the names are gone.
    await waitFor(() =>
      expect(
        screen.getByText('No unprocessable shipments available for this message.'),
      ).toBeInTheDocument(),
    )
    const pendingRow = screen.getByText('Manual pair').closest('tr')!
    expect(pendingRow).toHaveTextContent('from-email-one.pdf')
    expect(pendingRow).toHaveTextContent('from-email-two.pdf')
  })
})
