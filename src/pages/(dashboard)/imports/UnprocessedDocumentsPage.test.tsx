import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { M365UnprocessedDocument } from '@/types/recovery-m365-api'

import { UnprocessedDocumentsPage } from './UnprocessedDocumentsPage'

/**
 * Covers what is specific to the CROSS-IMPORT view: that rows from different
 * import jobs coexist in one list, that a selection survives the list changing
 * underneath it, and that the pair posted to the backend carries each side's
 * own `documentId` — the thing that makes pairing across imports possible at
 * all, and the thing a per-document implementation would silently get wrong.
 */

// `mock`-prefixed so jest.mock's hoisted factories may close over them.
const mockCreateCrossImportShipment = jest.fn()
type ListQueryArgs = { page?: number; limit?: number; importJobId?: string; search?: string }
let mockQueryArgs: ListQueryArgs | undefined
let mockQueryCalls: (ListQueryArgs | undefined)[]
let mockQueryState: {
  data?: { content: unknown }
  isFetching: boolean
  isError: boolean
}

jest.mock('@/app/services/recoveryM365Api', () => ({
  useGetM365UnprocessedDocumentsQuery: (args: ListQueryArgs | undefined) => {
    mockQueryCalls.push(args)
    // The paged list is the first call; the modal's full-set call passes
    // limit 200 and must not be mistaken for it.
    if (args?.limit !== 200) {
      mockQueryArgs = args
    }
    return mockQueryState
  },
  useCreateCrossImportShipmentMutation: () => [mockCreateCrossImportShipment],
}))

jest.mock('@/lib/showCustomToast', () => ({ showCustomToast: jest.fn() }))

const page = () => (
  <MemoryRouter>
    <UnprocessedDocumentsPage />
  </MemoryRouter>
)

/** The page navigates (empty-state action), so it needs a router. */
const renderPage = () => render(page())

const JOB_A = '66c1a2b3d4e5f6a7b8c9d0a1'
const JOB_B = '66c1a2b3d4e5f6a7b8c9d0b2'
const DOC_A = 'doc-for-job-a'
const DOC_B = 'doc-for-job-b'

function row(overrides: Partial<M365UnprocessedDocument> = {}): M365UnprocessedDocument {
  return {
    id: `${DOC_A}:0`,
    documentId: DOC_A,
    index: 0,
    filename: 'invoice-8871.pdf',
    type: 'PO',
    size: 1024,
    contentType: 'application/pdf',
    failureReasonCode: 'C88_MISSING',
    summary: 'No matching customs declaration in this import.',
    s3Key: 'accepted/u/job-a/unprocessable/invoice-8871.pdf',
    bucket: 'bucket',
    importJobId: JOB_A,
    folderNames: ['Inbox'],
    mailboxEmail: 'ops@example.com',
    importedAt: '2026-08-20T09:12:00.000Z',
    ...overrides,
  }
}

/** The CI came from import A, the C88 from import B — two separate documents. */
const CI_ROW = row()
const C88_ROW = row({
  id: `${DOC_B}:4`,
  documentId: DOC_B,
  index: 4,
  filename: 'c88-declaration.pdf',
  type: 'C88',
  failureReasonCode: 'PO_MISSING',
  s3Key: 'accepted/u/job-b/unprocessable/c88-declaration.pdf',
  importJobId: JOB_B,
  folderNames: ['Archive'],
})

function setRows(items: M365UnprocessedDocument[], overrides: Record<string, unknown> = {}) {
  mockQueryState = {
    data: {
      content: {
        items,
        total: items.length,
        page: 1,
        limit: 25,
        totalPages: 1,
        importJobs: [
          { id: JOB_A, folderNames: ['Inbox'], mailboxEmail: 'ops@example.com', importedAt: null },
          {
            id: JOB_B,
            folderNames: ['Archive'],
            mailboxEmail: 'ops@example.com',
            importedAt: null,
          },
        ],
        ...overrides,
      },
    },
    isFetching: false,
    isError: false,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockQueryCalls = []
  mockCreateCrossImportShipment.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  setRows([CI_ROW, C88_ROW])
})

const createShipmentButton = () => screen.getByRole('button', { name: 'Create Shipment' })

/** Opens the modal and fills in the title; the CI/C88 selects pre-fill by type. */
function openModalWithTitle(title: string) {
  fireEvent.click(createShipmentButton())
  fireEvent.change(screen.getByLabelText(/Shipment Title/), { target: { value: title } })
}

const submitModal = () =>
  fireEvent.click(screen.getAllByRole('button', { name: 'Create Shipment' }).at(-1) as HTMLElement)

describe('UnprocessedDocumentsPage', () => {
  it('lists documents from every import job in one table', () => {
    renderPage()

    // One flat list: a file from import A and one from import B are rows in the
    // same table, which is what makes pairing across them possible.
    expect(screen.getByText('invoice-8871.pdf')).toBeInTheDocument()
    expect(screen.getByText('c88-declaration.pdf')).toBeInTheDocument()
  })

  it('renders the failure reason using the same labels as the Inbox', () => {
    renderPage()

    expect(screen.getByText('C88 missing')).toBeInTheDocument()
    // PO_MISSING reads as "CI missing" to the user — the code names the MISSING
    // counterpart, not the document's own type.
    expect(screen.getByText('CI missing')).toBeInTheDocument()
  })

  it('offers every pairable file to the modal, not just the current page', () => {
    renderPage()
    fireEvent.click(createShipmentButton())

    // A counterpart three pages away is the normal case here, so the modal is
    // fed its own unpaginated request rather than the rows on screen.
    expect(mockQueryCalls.some((args) => args?.limit === 200)).toBe(true)
  })

  it('posts each side with its OWN documentId and index', async () => {
    renderPage()
    openModalWithTitle('Cross-import shipment')
    submitModal()

    await waitFor(() => expect(mockCreateCrossImportShipment).toHaveBeenCalledTimes(1))
    expect(mockCreateCrossImportShipment).toHaveBeenCalledWith({
      title: 'Cross-import shipment',
      ci: { documentId: DOC_A, index: 0, s3Key: CI_ROW.s3Key },
      c88: { documentId: DOC_B, index: 4, s3Key: C88_ROW.s3Key },
    })
  })

  it('hides both rows while the pairing request is in flight', async () => {
    let resolveRequest: (value: unknown) => void = () => {}
    mockCreateCrossImportShipment.mockReturnValue({
      unwrap: () => new Promise((resolve) => (resolveRequest = resolve)),
    })

    renderPage()
    openModalWithTitle('In flight')
    submitModal()

    await waitFor(() => expect(screen.queryByText('invoice-8871.pdf')).not.toBeInTheDocument())
    expect(screen.queryByText('c88-declaration.pdf')).not.toBeInTheDocument()

    resolveRequest({})
  })

  it('will not offer a file whose bytes were never stored', () => {
    setRows([row({ s3Key: null }), C88_ROW])
    renderPage()
    fireEvent.click(createShipmentButton())

    // Shown in the table, but the backend cannot re-read it, so it is not
    // selectable as either side of a pair.
    expect(screen.getByText('invoice-8871.pdf')).toBeInTheDocument()
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options.some((text) => text?.includes('invoice-8871.pdf'))).toBe(false)
    expect(options.some((text) => text?.includes('c88-declaration.pdf'))).toBe(true)
  })

  it('labels each option with the import it came from', () => {
    renderPage()
    fireEvent.click(createShipmentButton())

    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options.some((text) => text?.includes('from Inbox'))).toBe(true)
    expect(options.some((text) => text?.includes('from Archive'))).toBe(true)
  })

  it('sends the import-job filter to the query and resets to page one', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Import'), { target: { value: JOB_B } })

    expect(mockQueryArgs).toMatchObject({ importJobId: JOB_B, page: 1 })
  })

  it('distinguishes an empty list from an empty filtered list', () => {
    setRows([])
    const { rerender } = renderPage()
    expect(screen.getByText(/Everything your imports fetched has been paired/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Import'), { target: { value: JOB_A } })
    rerender(page())
    expect(screen.getByText(/match these filters/)).toBeInTheDocument()
    // The filtered state offers a way back out; the genuinely-empty one must
    // not, or it sends the user in a circle.
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
  })

  it('clears every filter from the filtered empty state', () => {
    setRows([])
    renderPage()

    fireEvent.change(screen.getByLabelText('Import'), { target: { value: JOB_A } })
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(screen.getByLabelText('Import')).toHaveValue('')
    expect(mockQueryArgs).toMatchObject({ page: 1 })
    expect(mockQueryArgs).not.toHaveProperty('importJobId')
  })
})
