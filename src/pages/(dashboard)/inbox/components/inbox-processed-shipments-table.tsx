import { Eye } from 'lucide-react'

import { TableHeader, TableListing, TableShell } from '@/components/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { InboxShipmentRow } from '@/data/mock/inbox'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

const thCell = 'px-4 py-3 text-left text-xs font-semibold text-rp-muted sm:px-6'

export type InboxProcessedShipmentsTableProps = {
  rows: InboxShipmentRow[]
  className?: string
}

export function InboxProcessedShipmentsTable({
  rows,
  className,
}: InboxProcessedShipmentsTableProps) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <p className="text-sm text-rp-muted">{t('inbox.processed.empty')}</p>
  }

  return (
    <Card padding="none" className={cn('overflow-hidden border-rp-border shadow-sm', className)}>
      <CardContent className="p-0">
        <TableShell>
          <TableHeader>
            <tr>
              <th className={thCell}>{t('inbox.processed.col.title')}</th>
              <th className={thCell}>{t('inbox.processed.col.date')}</th>
              <th className={thCell}>{t('inbox.processed.col.shipVia')}</th>
              <th className={thCell}>{t('inbox.processed.col.po')}</th>
              <th className={cn(thCell, 'text-right')}>{t('inbox.processed.col.actions')}</th>
            </tr>
          </TableHeader>
          <TableListing>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-rp-surface/40">
                <td className="px-4 py-3 text-sm font-medium text-rp-fg sm:px-6">{row.title}</td>
                <td className="px-4 py-3 text-sm text-rp-muted sm:px-6">{row.date}</td>
                <td className="px-4 py-3 text-sm text-rp-muted sm:px-6">{row.shipVia}</td>
                <td className="px-4 py-3 text-sm text-rp-fg sm:px-6">{row.po}</td>
                <td className="px-4 py-3 text-right sm:px-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('common.view')}
                  >
                    <Eye className="h-4 w-4 text-rp-icon" />
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
