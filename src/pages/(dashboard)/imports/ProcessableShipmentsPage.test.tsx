import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { M365ProcessableShipment } from '@/types/recovery-m365-api'

import { ProcessableShipmentsPage } from './ProcessableShipmentsPage'

/**
 * Covers the two-table Imports processable view. The claims that matter:
 *
 *  - a pair created BY HAND on the Unprocessed Documents screen shows up here
 *    like any automatic one — that is the whole point of this screen;
 *  - the shipments table is scoped to import-produced shipments, not all of them;
 *  - a pair whose shipment does not exist yet still renders, with its view
 *    action disabled rather than navigating nowhere.
 */

const mockNavigate = jest.fn()
const mockGetRecoveryDownloadUrl = jest.fn()
let mockDocumentsState: { data?: { content: unknown }; isFetching: boolean; isError: boolean }
let mockShipmentsState: { data?: { content: unknown }; isFetching: boolean }
let mockShipmentsArgs: unknown

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('@/app/services/recoveryM365Api', () => ({
  useGetM365ProcessableShipmentsQuery: () => mockDocumentsState,
}))

jest.mock('@/app/services/recoveryApi', () => ({
  useGetRecoveryDownloadUrlMutation: () => [mockGetRecoveryDownloadUrl],
  useGetRecoveryShipmentsListQuery: (args: unknown) => {
    mockShipmentsArgs = args
    return mockShipmentsState
  },
}))

jest.mock('@/lib/showCustomToast', () => ({ showCustomToast: jest.fn() }))

const DOC_A = 'doc-for-job-a'
const SHIPMENT_DB_ID = '66c1a2b3d4e5f6a7b8c9d0ff'

function pair(overrides: Partial<M365ProcessableShipment> = {}): M365ProcessableShipment {
  return {
    id: `${DOC_A}:0`,
    documentId: DOC_A,
    index: 0,
    shipmentKey: 'SHP-8871',
    shipmentId: SHIPMENT_DB_ID,
    title: 'Container #10',
    date: '2024-07-14T00:00:00.000Z',
    c88: {
      filename: 'c88-declaration.pdf',
      s3Key: 'k/c88.pdf',
      bucket: 'bucket',
      contentType: 'application/pdf',
      size: 10,
    },
    po: {
      filename: 'invoice-8871.pdf',
      s3Key: 'k/invoice.pdf',
      bucket: 'bucket',
      contentType: 'application/pdf',
      size: 20,
    },
    importJobId: 'job-a',
    folderNames: ['Inbox'],
    mailboxEmail: 'ops@example.com',
    importedAt: '2024-07-10T00:00:00.000Z',
    ...overrides,
  }
}

function setPairs(items: M365ProcessableShipment[]) {
  mockDocumentsState = {
    data: {
      content: {
        items,
        total: items.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        importJobs: [
          {
            id: 'job-a',
            folderNames: ['Inbox'],
            mailboxEmail: 'ops@example.com',
            importedAt: null,
          },
        ],
      },
    },
    isFetching: false,
    isError: false,
  }
}

function setShipments(data: unknown[]) {
  mockShipmentsState = {
    data: { content: { data, total: data.length, page: 1, limit: 5, totalPages: 1 } },
    isFetching: false,
  }
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProcessableShipmentsPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  jest.clearAllMocks()
  mockGetRecoveryDownloadUrl.mockReturnValue({
    unwrap: () => Promise.resolve({ content: { downloadUrl: 'https://signed.example/file' } }),
  })
  setPairs([pair()])
  setShipments([])
})

describe('ProcessableShipmentsPage', () => {
  it('shows a pair with both file names and its shipment title', () => {
    renderPage()

    const row = screen.getByText('Container #10').closest('tr') as HTMLElement
    expect(within(row).getByText('c88-declaration.pdf')).toBeInTheDocument()
    expect(within(row).getByText('invoice-8871.pdf')).toBeInTheDocument()
    expect(
      within(row).getByText(new Date('2024-07-14T00:00:00.000Z').toLocaleDateString()),
    ).toBeInTheDocument()
  })

  it('shows a hand-made cross-import pair alongside automatic ones', () => {
    // Nothing marks a manual pair as different — it is stored on an import-job
    // document like any other, which is exactly what this asserts.
    setPairs([pair(), pair({ id: `${DOC_A}:1`, index: 1, title: 'Manual pair from two imports' })])
    renderPage()

    expect(screen.getByText('Container #10')).toBeInTheDocument()
    expect(screen.getByText('Manual pair from two imports')).toBeInTheDocument()
  })

  it('opens the shipment from the row action', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'View shipment' }))

    expect(mockNavigate).toHaveBeenCalledWith(`/shipments/${SHIPMENT_DB_ID}`)
  })

  it('renders a pair whose shipment does not exist yet, with view disabled', () => {
    setPairs([pair({ shipmentId: null, title: 'SHP-8871' })])
    renderPage()

    // The pair is real even before its shipment is persisted — hiding the row
    // would make a normal transient state look like data loss.
    expect(screen.getByText('SHP-8871')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View shipment' })).toBeDisabled()
  })

  it('presigns a download against the document that owns the file', async () => {
    renderPage()

    fireEvent.click(screen.getByText('c88-declaration.pdf'))

    await waitFor(() => expect(mockGetRecoveryDownloadUrl).toHaveBeenCalledTimes(1))
    expect(mockGetRecoveryDownloadUrl).toHaveBeenCalledWith({
      id: DOC_A,
      s3Key: 'k/c88.pdf',
      bucket: 'bucket',
      recordType: 'processed',
      fileName: 'c88-declaration.pdf',
    })
  })

  it('does not attempt a download for a file with no storage coordinates', async () => {
    setPairs([pair({ c88: { ...pair().c88, s3Key: null, bucket: null } })])
    renderPage()

    // The name still shows — the pair is real — but there is nothing to
    // presign, so clicking must be inert rather than firing a doomed request.
    fireEvent.click(screen.getByText('c88-declaration.pdf'))

    await waitFor(() => expect(mockGetRecoveryDownloadUrl).not.toHaveBeenCalled())
  })

  it('renders a pair whose file is missing entirely', () => {
    setPairs([pair({ po: { ...pair().po, filename: null } })])
    renderPage()

    expect(screen.getByText('c88-declaration.pdf')).toBeInTheDocument()
    expect(screen.queryByText('invoice-8871.pdf')).not.toBeInTheDocument()
  })

  it('scopes the shipments table to import-produced shipments', () => {
    renderPage()

    // Without this the Imports section would list every shipment the user has,
    // including ones that never came from an import.
    expect(mockShipmentsArgs).toMatchObject({ source: 'm365-import' })
  })

  it('offers a way to the unprocessed screen when nothing is paired yet', () => {
    setPairs([])
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Go to Unprocessed Documents' }))

    expect(mockNavigate).toHaveBeenCalledWith('/imports/unprocessed-documents')
  })

  it('offers to clear filters instead when the filters are what emptied it', () => {
    setPairs([])
    const { rerender } = renderPage()

    fireEvent.change(screen.getByLabelText('Import'), { target: { value: 'job-a' } })
    rerender(
      <MemoryRouter>
        <ProcessableShipmentsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to Unprocessed Documents' })).toBeNull()
  })

  it('sends the user to All Shipments from View All', () => {
    setShipments([{ _id: 's-1', shipmentTitle: 'Shipment One', status: 'draft' }])
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'View All' }))

    expect(mockNavigate).toHaveBeenCalledWith('/shipments')
  })

  describe('Processed Shipments with nothing in it', () => {
    it('renders the section empty state as a card, not a bare sentence', () => {
      setShipments([])
      renderPage()

      // The sentence alone sat where a table was about to appear and read as a
      // half-loaded screen. It belongs in the same card the tables above use.
      const description = screen.getByText('No shipments have been created from your imports yet.')
      expect(screen.getByText('No processed shipments')).toBeInTheDocument()
      expect(description.tagName).toBe('P')
      expect(screen.getByRole('button', { name: 'View All Shipments' })).toBeInTheDocument()
    })

    it('drops the header View All link, leaving the card as the only way through', () => {
      setShipments([])
      renderPage()

      expect(screen.queryByRole('button', { name: 'View All' })).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'View All Shipments' }))
      expect(mockNavigate).toHaveBeenCalledWith('/shipments')
    })

    it('still labels the section so the empty state is attributable', () => {
      setShipments([])
      renderPage()

      expect(screen.getByText('Processed Shipments')).toBeInTheDocument()
    })
  })
})
