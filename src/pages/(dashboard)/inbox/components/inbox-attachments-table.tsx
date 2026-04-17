import { Download } from 'lucide-react'

import { TableHeader, TableListing, TableShell } from '@/components/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { InboxAttachment } from '@/data/mock/inbox'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

const thCell = 'px-4 py-3 text-left text-xs font-semibold text-rp-muted sm:px-6'

function statusLabel(status: InboxAttachment['status'], t: (key: string) => string): string {
  if (status === 'passed') return t('inbox.attachments.status.passed')
  if (status === 'failed') return t('inbox.attachments.status.failed')
  return t('inbox.attachments.status.pending')
}

function statusClass(status: InboxAttachment['status']): string {
  if (status === 'passed') return 'text-rp-success'
  if (status === 'failed') return 'text-redOne'
  return 'text-rp-muted'
}

export type InboxAttachmentsTableProps = {
  attachments: InboxAttachment[]
  className?: string
}

export function InboxAttachmentsTable({ attachments, className }: InboxAttachmentsTableProps) {
  const { t } = useI18n()
  if (attachments.length === 0) {
    return <p className="text-sm text-rp-muted">{t('inbox.attachments.empty')}</p>
  }

  return (
    <Card padding="none" className={cn('overflow-hidden border-rp-border shadow-sm', className)}>
      <CardContent className="p-0">
        <TableShell>
          <TableHeader>
            <tr>
              <th className={thCell}>{t('inbox.attachments.col.attachment')}</th>
              <th className={thCell}>{t('inbox.attachments.col.size')}</th>
              <th className={thCell}>{t('inbox.attachments.col.status')}</th>
              <th className={cn(thCell, 'text-right')}>{t('inbox.attachments.col.action')}</th>
            </tr>
          </TableHeader>
          <TableListing>
            {attachments.map((row) => (
              <tr key={row.id} className="hover:bg-rp-surface/40">
                <td className="px-4 py-3 text-sm font-medium text-rp-fg sm:px-6">{row.name}</td>
                <td className="px-4 py-3 text-sm text-rp-muted sm:px-6">{row.size}</td>
                <td
                  className={cn('px-4 py-3 text-sm font-medium sm:px-6', statusClass(row.status))}
                >
                  {statusLabel(row.status, t)}
                </td>
                <td className="px-4 py-3 text-right sm:px-6">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {t('inbox.attachments.download')}
                  </Button>
                </td>
              </tr>
            ))}
          </TableListing>
        </TableShell>
      </CardContent>
    </Card>
  )
}
