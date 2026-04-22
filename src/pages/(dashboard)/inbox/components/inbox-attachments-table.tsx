import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import type { InboxAttachment } from '@/pages/(dashboard)/inbox/types'

const thCell = 'px-3 py-3 text-left text-lg font-normal text-blackFive'

function statusLabel(status: InboxAttachment['status'], t: (key: string) => string): string {
  if (status === 'passed') return t('inbox.attachments.status.passed')
  if (status === 'failed') return t('inbox.attachments.status.failed')
  return t('inbox.attachments.status.pending')
}

function statusClass(status: InboxAttachment['status']): string {
  if (status === 'passed') return 'bg-[#2E7D321A] text-[#2E7D32]'
  if (status === 'failed') return 'bg-[#C628281A] text-[#C62828]'
  return 'bg-lightYellowThree text-yellow'
}

export type InboxAttachmentsTableProps = {
  attachments: InboxAttachment[]
  className?: string
  onDownload?: (attachment: InboxAttachment) => Promise<void> | void
  downloadingAttachmentId?: string | null
}

export function InboxAttachmentsTable({
  attachments,
  className,
  onDownload,
  downloadingAttachmentId = null,
}: InboxAttachmentsTableProps) {
  const { t } = useI18n()
  if (attachments.length === 0) {
    return <p className="text-base font-light text-blackFive">{t('inbox.attachments.empty')}</p>
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-bottomBorder">
            <th className={thCell}>{t('inbox.attachments.col.attachment')}</th>
            <th className={thCell}>{t('inbox.attachments.col.size')}</th>
            <th className={thCell}>{t('inbox.attachments.col.status')}</th>
            <th className={thCell}>{t('inbox.attachments.col.action')}</th>
          </tr>
        </thead>
        <tbody>
          {attachments.map((row) => (
            <tr key={row.id} className="border-b border-bottomBorder">
              <td
                className="max-w-[320px] truncate px-3 py-3 text-sm font-light leading-[100%] tracking-[0] text-black"
                title={row.name}
              >
                {row.name}
              </td>
              <td
                className="max-w-[130px] truncate px-3 py-3 text-sm font-light leading-[100%] tracking-[0] text-black"
                title={row.size}
              >
                {row.size}
              </td>
              <td className="px-3 py-3">
                <span className={cn('rounded-md px-2 py-1 text-base', statusClass(row.status))}>
                  {statusLabel(row.status, t)}
                </span>
              </td>
              <td className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => onDownload?.(row)}
                  disabled={
                    !row.s3Key || !row.bucket || downloadingAttachmentId === row.id || !onDownload
                  }
                  className="flex items-center gap-2 rounded-md border border-bottomBorder px-2 py-1 text-base text-black"
                >
                  <span className="icon-Download text-sm" aria-hidden />
                  {downloadingAttachmentId === row.id
                    ? `${t('inbox.attachments.download')}...`
                    : t('inbox.attachments.download')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
