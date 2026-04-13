import type { InboxEmail } from '@/data/mock/inbox'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

import { InboxAttachmentsTable } from './inbox-attachments-table'
import { InboxProcessedShipmentsTable } from './inbox-processed-shipments-table'

export type InboxDetailPanelProps = {
  email: InboxEmail | null
  className?: string
}

export function InboxDetailPanel({ email, className }: InboxDetailPanelProps) {
  const { t } = useI18n()
  if (!email) {
    return (
      <section
        className={cn(
          'flex min-h-[280px] flex-1 items-center justify-center bg-white p-6 text-center lg:min-h-0',
          className,
        )}
      >
        <div>
          <p className="text-base font-semibold text-rp-fg">{t('inbox.detail.emptyTitle')}</p>
          <p className="mt-2 text-sm text-rp-muted">{t('inbox.detail.emptyDescription')}</p>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-white p-4 md:p-6',
        className,
      )}
    >
      <header className="shrink-0 space-y-2 border-b border-rp-border pb-4">
        <h1 className="text-xl font-bold text-rp-heading md:text-2xl">{email.subject}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-rp-muted">
          <span>
            <span className="font-medium text-rp-fg">{t('inbox.detail.from')}</span>{' '}
            {email.fromAddress}
          </span>
          <span>
            <span className="font-medium text-rp-fg">{t('inbox.detail.received')}</span>{' '}
            {email.receivedDetail}
          </span>
          <span>
            <span className="font-medium text-rp-fg">{t('inbox.detail.domain')}</span>{' '}
            {email.domain}
          </span>
        </div>
      </header>

      <div className="rounded-xl border border-rp-border bg-rp-bg p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-rp-border bg-rp-surface/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rp-muted">
              {t('inbox.detail.tenant')}
            </p>
            <p className="mt-1 text-sm font-medium text-rp-fg">{email.tenant}</p>
          </div>
          <div className="rounded-lg border border-rp-border bg-rp-surface/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rp-muted">
              {t('inbox.detail.received')}
            </p>
            <p className="mt-1 text-sm font-medium text-rp-fg">{email.tenantReceivedAt}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-rp-fg">{t('inbox.detail.attachments')}</h2>
          <InboxAttachmentsTable attachments={email.attachments} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-rp-fg">
          {t('inbox.detail.processedShipments')}
        </h2>
        <InboxProcessedShipmentsTable rows={email.shipments} />
      </div>
    </section>
  )
}
