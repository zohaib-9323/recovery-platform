import { render, screen } from '@testing-library/react'

import type { M365SkipReason, M365SkippedItem } from '@/types/recovery-m365-api'

import { ImportSkippedAttachments } from './import-skipped-attachments'

function skipped(over: Partial<M365SkippedItem> = {}): M365SkippedItem {
  return {
    id: over.id ?? 'id-1',
    attachmentName: over.attachmentName ?? 'lunch-menu.pdf',
    attachmentContentType: over.attachmentContentType ?? 'application/pdf',
    attachmentSizeBytes: over.attachmentSizeBytes ?? 1024,
    attachmentSizeFormatted: over.attachmentSizeFormatted ?? '1 KB',
    stage: over.stage ?? 'classification',
    reason: over.reason ?? 'not_shipment_document',
    reasonLabel: over.reasonLabel ?? 'Not a shipment document',
    detail: over.detail ?? null,
    createdAt: over.createdAt ?? '2026-08-24T10:49:00.000Z',
  }
}

describe('ImportSkippedAttachments', () => {
  it('renders nothing when no attachments were skipped', () => {
    const { container } = render(<ImportSkippedAttachments skipped={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists each skipped attachment with its reason', () => {
    render(
      <ImportSkippedAttachments
        skipped={[
          skipped({ id: 'a', attachmentName: 'menu.pdf' }),
          skipped({
            id: 'b',
            attachmentName: 'photo.jpg',
            reason: 'unsupported_format',
            reasonLabel: 'File type not supported',
          }),
        ]}
      />,
    )

    expect(screen.getByText('Not imported (2)')).toBeInTheDocument()
    expect(screen.getByText('menu.pdf')).toBeInTheDocument()
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
    expect(screen.getByText('Not a shipment document')).toBeInTheDocument()
    expect(screen.getByText('File type not supported')).toBeInTheDocument()
  })

  it('makes clear the files were not saved and cannot be downloaded', () => {
    render(<ImportSkippedAttachments skipped={[skipped()]} />)
    expect(screen.getByText(/only their details are kept/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument()
  })

  it('flags recoverable problems separately from deliberate filtering', () => {
    render(
      <ImportSkippedAttachments
        skipped={[
          skipped({ id: 'ok', reason: 'not_shipment_document' }),
          skipped({
            id: 'bad',
            reason: 'download_failed',
            reasonLabel: 'Could not download from Microsoft 365',
          }),
        ]}
      />,
    )
    // Only the download failure counts as needing attention.
    expect(screen.getByText('1 needs attention')).toBeInTheDocument()
    expect(screen.getByText(/Re-running the import may fix this/i)).toBeInTheDocument()
  })

  it('shows a plain-English hint for every reason code', () => {
    const reasons: M365SkipReason[] = [
      'unsupported_format',
      'zero_byte',
      'signature_asset',
      'too_large',
      'download_failed',
      'duplicate',
      'type_mismatch',
      'not_shipment_document',
      'classification_error',
    ]
    render(
      <ImportSkippedAttachments
        skipped={reasons.map((reason, i) => skipped({ id: `r${i}`, reason }))}
      />,
    )
    // Every row renders a non-empty hint paragraph — no missing/undefined copy.
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
    expect(screen.getByText('Not imported (9)')).toBeInTheDocument()
  })
})
