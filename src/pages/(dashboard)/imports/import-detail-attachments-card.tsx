import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

import { useDownloadM365ImportItemMutation } from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { M365FetchedItem } from '@/types/recovery-m365-api'

const ITEM_STATUS_CLASS: Record<M365FetchedItem['status'], string> = {
  fetched: 'text-rp-green',
  duplicate: 'text-rp-muted',
  failed: 'text-redOne',
}

const ITEM_STATUS_LABEL: Record<M365FetchedItem['status'], string> = {
  fetched: 'Passed',
  duplicate: 'Duplicate',
  failed: 'Failed',
}

function formatReceived(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

/** Download button — matches the Button usage elsewhere in the Imports page. */
function AttachmentDownloadButton({ jobId, item }: { jobId: string; item: M365FetchedItem }) {
  const [downloadItem, { isLoading }] = useDownloadM365ImportItemMutation()
  const [downloadError, setDownloadError] = useState(false)
  const canDownload = Boolean(item.graphAttachmentId || item.s3Key)

  async function handleDownload() {
    setDownloadError(false)
    try {
      const blob = await downloadItem({ jobId, itemId: item.id }).unwrap()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.attachmentName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError(true)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={!canDownload || isLoading}
      title={downloadError ? 'Download failed — try again' : `Download ${item.attachmentName}`}
      className={cn(downloadError && 'text-redOne')}
    >
      {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
      Download
    </Button>
  )
}

export type ImportDetailAttachmentsCardProps = {
  jobId: string
  isActive: boolean
  isLoading: boolean
  items: M365FetchedItem[]
  page: number
  totalPages: number
  onLoadMore: () => void
}

export function ImportDetailAttachmentsCard({
  jobId,
  isActive,
  isLoading,
  items,
  page,
  totalPages,
  onLoadMore,
}: ImportDetailAttachmentsCardProps) {
  return (
    <section className="flex w-full flex-col gap-5 rounded-[10px] border border-rp-border bg-rp-page p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-rp-heading">Attachments</h2>

      {isActive ? (
        <p className="text-sm text-rp-muted">
          Attachments will appear here once the import completes.
        </p>
      ) : isLoading && page === 1 ? (
        <div className="flex justify-center py-6">
          <CustomLoader />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-rp-muted">No attachments were fetched in this import.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[8px] border border-rp-border">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">{`${items.length} fetched attachments`}</caption>
              <thead>
                <tr className="border-b border-rp-border bg-rp-surface text-left text-xs text-rp-muted">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Attachment</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rp-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-rp-surface/50">
                    <td
                      className="max-w-[220px] truncate px-4 py-3 text-rp-fg"
                      title={item.subject}
                    >
                      {truncate(item.subject, 44)}
                    </td>
                    <td
                      className="max-w-[220px] truncate px-4 py-3 text-rp-fg"
                      title={item.attachmentName}
                    >
                      {item.attachmentName}
                    </td>
                    <td className="px-4 py-3 text-rp-muted">{item.attachmentSizeFormatted}</td>
                    <td className={cn('px-4 py-3 font-medium', ITEM_STATUS_CLASS[item.status])}>
                      {ITEM_STATUS_LABEL[item.status]}
                    </td>
                    <td className="px-4 py-3 text-rp-muted">
                      {formatReceived(item.receivedDateTime)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AttachmentDownloadButton jobId={jobId} item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {page < totalPages && (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" disabled={isLoading} onClick={onLoadMore}>
                {isLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
