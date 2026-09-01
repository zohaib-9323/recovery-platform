import { render, screen } from '@testing-library/react'

import type { M365SkippedItem } from '@/types/recovery-m365-api'

import { countReportedSkips, ImportSkippedAttachments } from './import-skipped-attachments'

/**
 * This section reports ONE skip reason: an attachment that was already
 * imported. Every other reason an import discards a file is deliberately not
 * surfaced here, so most of what these tests pin is what does NOT render.
 */

function skipped(over: Partial<M365SkippedItem> = {}): M365SkippedItem {
  return {
    id: over.id ?? 'id-1',
    attachmentName: over.attachmentName ?? 'invoice.pdf',
    attachmentContentType: over.attachmentContentType ?? 'application/pdf',
    attachmentSizeBytes: over.attachmentSizeBytes ?? 1024,
    attachmentSizeFormatted: over.attachmentSizeFormatted ?? '1 KB',
    stage: over.stage ?? 'classification',
    reason: over.reason ?? 'duplicate',
    reasonLabel: over.reasonLabel ?? 'Already imported',
    detail: over.detail ?? null,
    createdAt: over.createdAt ?? '2026-08-24T10:49:00.000Z',
  }
}

describe('ImportSkippedAttachments', () => {
  it('renders nothing when no attachments were skipped', () => {
    const { container } = render(<ImportSkippedAttachments skipped={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists each already-imported attachment with its size and reason', () => {
    render(
      <ImportSkippedAttachments
        skipped={[
          skipped({ id: 'a', attachmentName: 'CAD Entry Document.xlsx' }),
          skipped({
            id: 'b',
            attachmentName: 'CDS Entry Document.pdf',
            attachmentSizeFormatted: '283 KB',
          }),
        ]}
      />,
    )

    expect(screen.getByText('Not imported (2)')).toBeInTheDocument()
    expect(screen.getByText('CAD Entry Document.xlsx')).toBeInTheDocument()
    expect(screen.getByText('283 KB')).toBeInTheDocument()
    expect(screen.getAllByText('Already imported')).toHaveLength(2)
    expect(screen.getAllByText('An identical file has already been imported.')).toHaveLength(2)
  })

  it('hides attachments skipped for any other reason', () => {
    render(
      <ImportSkippedAttachments
        skipped={[
          skipped({ id: 'dupe', attachmentName: 'already-here.pdf' }),
          skipped({
            id: 'other',
            attachmentName: 'photo.jpg',
            reason: 'unsupported_format',
            reasonLabel: 'File type not supported',
          }),
          skipped({
            id: 'problem',
            attachmentName: 'broken.pdf',
            reason: 'download_failed',
            reasonLabel: 'Could not download from Microsoft 365',
          }),
        ]}
      />,
    )

    expect(screen.getByText('already-here.pdf')).toBeInTheDocument()
    expect(screen.queryByText('photo.jpg')).not.toBeInTheDocument()
    expect(screen.queryByText('broken.pdf')).not.toBeInTheDocument()
    // The count reflects what is shown, not what was passed in — a header
    // reading (3) above one row is worse than no header at all.
    expect(screen.getByText('Not imported (1)')).toBeInTheDocument()
  })

  it('renders nothing when every skip was for some other reason', () => {
    const { container } = render(
      <ImportSkippedAttachments
        skipped={[skipped({ reason: 'too_large', reasonLabel: 'File is larger than 25 MB' })]}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('counts only what the section will show, for callers that badge it', () => {
    expect(
      countReportedSkips([
        skipped({ id: 'a' }),
        skipped({ id: 'b', reason: 'too_large' }),
        skipped({ id: 'c', reason: 'download_failed' }),
      ]),
    ).toBe(1)
    expect(countReportedSkips(undefined)).toBe(0)
  })

  it('makes clear the files were not saved and cannot be downloaded', () => {
    render(<ImportSkippedAttachments skipped={[skipped()]} />)

    expect(screen.getByText(/only their details are kept/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument()
  })

  it('shows the server-supplied reason label rather than a hard-coded one', () => {
    render(<ImportSkippedAttachments skipped={[skipped({ reasonLabel: 'Already Imported' })]} />)

    expect(screen.getByText('Already Imported')).toBeInTheDocument()
  })
})
