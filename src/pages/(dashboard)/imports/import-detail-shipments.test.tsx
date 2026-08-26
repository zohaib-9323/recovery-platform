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
 *  - Retry is scoped out here, so no row action menu renders;
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

jest.mock('@/app/services/recoveryM365Api', () => ({
  useGetM365ImportJobShipmentsQuery: () => ({
    ...mockQueryState,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
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

  it('renders no per-row action menu, because Retry is not part of this view', () => {
    render(<ImportDetailShipments jobId={JOB_ID} isJobActive={false} />)

    const row = screen.getByText('from-email-one.pdf').closest('tr')!
    expect(row.querySelector('button')).toBeNull()
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
