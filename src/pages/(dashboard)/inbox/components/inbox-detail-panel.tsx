import { useState } from 'react'

import {
  useGetRecoveryDownloadUrlMutation,
  useMoveProcessableToUnprocessableMutation,
  useMoveUnprocessableToProcessableMutation,
} from '@/app/services/recoveryApi'
import { useI18n } from '@/i18n/useI18n'
import { showCustomToast } from '@/lib/showCustomToast'
import { cn } from '@/lib/utils'
import type { InboxAttachment, InboxEmail } from '@/pages/(dashboard)/inbox/types'

import { InboxAttachmentsTable } from './inbox-attachments-table'
import { InboxProcessedShipmentsTable } from './inbox-processed-shipments-table'
import { InboxUnprocessedShipmentsTable } from './inbox-unprocessed-shipments-table'

export type InboxDetailPanelProps = {
  email: InboxEmail | null
  isLoading?: boolean
  errorMessage?: string | null
  onInboxUpdated?: () => Promise<unknown> | unknown
  className?: string
}

export function InboxDetailPanel({
  email,
  isLoading = false,
  errorMessage = null,
  onInboxUpdated,
  className,
}: InboxDetailPanelProps) {
  const { t } = useI18n()
  const [getRecoveryDownloadUrl] = useGetRecoveryDownloadUrlMutation()
  const [moveUnprocessableToProcessable] = useMoveUnprocessableToProcessableMutation()
  const [moveProcessableToUnprocessable] = useMoveProcessableToUnprocessableMutation()
  const [convertingProcessableIndex, setConvertingProcessableIndex] = useState<number | null>(null)
  const [convertingUnprocessableIndex, setConvertingUnprocessableIndex] = useState<number | null>(
    null,
  )
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null)
  const statusValue = String(email?.status ?? '')
    .toLowerCase()
    .trim()
  const normalizedStatus = email?.status
    ? email.status.charAt(0).toUpperCase() + email.status.slice(1)
    : 'N/A'
  const statusClass = statusValue.includes('processed')
    ? 'bg-[#2E7D321A] text-[#2E7D32]'
    : statusValue.includes('quarant')
      ? 'bg-[#C628281A] text-[#C62828]'
      : 'bg-lightYellowThree text-yellow'
  const isProcessed = statusValue.includes('processed')
  const isQuarantined = statusValue.includes('quarant')

  const handleConvertToProcessable = async (unprocessableIndex: number) => {
    if (!email) return
    try {
      setConvertingUnprocessableIndex(unprocessableIndex)
      await moveUnprocessableToProcessable({
        id: email.id,
        unprocessableIndex,
      }).unwrap()
      await onInboxUpdated?.()
    } catch {
      // Keep UI stable; parent refresh handles visible state changes.
    } finally {
      setConvertingUnprocessableIndex(null)
    }
  }

  const handleConvertToUnprocessable = async (processableIndex: number) => {
    if (!email) return
    try {
      setConvertingProcessableIndex(processableIndex)
      await moveProcessableToUnprocessable({
        id: email.id,
        processableIndex,
      }).unwrap()
      await onInboxUpdated?.()
    } catch {
      // Keep UI stable; parent refresh handles visible state changes.
    } finally {
      setConvertingProcessableIndex(null)
    }
  }

  const handleDownloadAttachment = async (attachment: InboxAttachment) => {
    if (!email) return
    const fallbackRecordType = isQuarantined ? 'quarantined' : 'processed'
    const recordType = attachment.recordType ?? fallbackRecordType
    if (!attachment.s3Key || !attachment.bucket) {
      showCustomToast({
        type: 'error',
        title: 'Error',
        message: 'Attachment is missing download metadata.',
      })
      return
    }

    try {
      setDownloadingAttachmentId(attachment.id)
      const s3KeyFileName = attachment.s3Key.split('/').filter(Boolean).pop()
      const fileName = s3KeyFileName || attachment.name
      const response = await getRecoveryDownloadUrl({
        id: email.id,
        s3Key: attachment.s3Key,
        bucket: attachment.bucket,
        recordType,
        fileName,
      }).unwrap()
      const downloadUrl = response?.content?.downloadUrl

      if (!downloadUrl) {
        throw new Error('Download URL is not available.')
      }

      window.location.href = downloadUrl
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate download link for attachment.'
      showCustomToast({
        type: 'error',
        title: 'Error',
        message,
      })
    } finally {
      setTimeout(() => setDownloadingAttachmentId(null), 1000)
    }
  }

  if (!email && isLoading) {
    return (
      <section
        className={cn(
          'flex min-h-[280px] flex-1 items-center justify-center bg-white p-6 text-center lg:min-h-0',
          className,
        )}
      >
        <p className="text-base font-light text-blackFive">{t('inbox.detail.loading')}</p>
      </section>
    )
  }

  if (!email && errorMessage) {
    return (
      <section
        className={cn(
          'flex min-h-[280px] flex-1 items-center justify-center bg-white p-6 text-center lg:min-h-0',
          className,
        )}
      >
        <p className="text-base font-light text-redOne">{errorMessage}</p>
      </section>
    )
  }

  if (!email) {
    return (
      <section
        className={cn(
          'flex min-h-[280px] flex-1 items-center justify-center bg-white p-6 text-center lg:min-h-0',
          className,
        )}
      >
        <div>
          <p className="text-lg font-semibold text-black">{t('inbox.detail.emptyTitle')}</p>
          <p className="mt-2 text-sm font-light text-blackFive">
            {t('inbox.detail.emptyDescription')}
          </p>
        </div>
      </section>
    )
  }

  const contextAttachments = email.attachments
  const messageContextCardClass = cn('rounded-lg border p-3 border-[#E4E4E4] bg-[#F8F8F8]')

  return (
    <section
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6',
        className,
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 rounded-lg border border-bottomBorder px-3 py-3 sm:px-4">
        <div className="space-y-2">
          <h1
            className="max-w-[420px] truncate text-[18px] font-semibold leading-[100%] tracking-[0] text-black"
            title={email.messageId}
          >
            {email.messageId}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-light text-blackFive">
            <span>
              <span className="font-medium text-black">{t('inbox.detail.from')}</span>{' '}
              {email.fromAddress}
            </span>
            <span>
              <span className="font-medium text-black">{t('inbox.detail.received')}</span>{' '}
              {email.receivedDetail}
            </span>
            <span>
              <span className="font-medium text-black">{t('inbox.detail.domain')}</span>{' '}
              {email.domain}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium',
            statusClass,
          )}
        >
          • {normalizedStatus}
        </span>
      </header>

      <div className="rounded-lg border border-bottomBorder p-4 shadow-[0px_4px_16px_0px_#4C67641A]">
        <div className="">
          <div className="rounded-lg border border-bottomBorder p-4">
            <h3 className="mb-4 text-[18px] font-semibold leading-[100%] tracking-[0] text-black">
              {t('inbox.detail.messageContext')}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={messageContextCardClass}>
                <p className="text-sm font-medium leading-[100%] tracking-[0] text-black">
                  {t('inbox.detail.tenant')}
                </p>
                <p className="mt-2 truncate text-sm font-light   leading-[140%] tracking-[0] text-blackFive">
                  {email.domain}
                </p>
              </div>
              <div className={messageContextCardClass}>
                <p className="text-sm font-medium leading-[100%] tracking-[0] text-black">
                  {t('inbox.detail.received')}
                </p>
                <p className="mt-2 truncate text-sm font-light leading-[140%] tracking-[0] text-blackFive">
                  {email.receivedDetail}
                </p>
              </div>
              {isQuarantined ? (
                <div className={cn(messageContextCardClass, 'sm:col-span-2')}>
                  <p className="text-sm font-medium leading-[100%] tracking-[0] text-black">
                    {t('inbox.detail.reason')}
                  </p>
                  <p className="mt-2 truncate text-sm font-light leading-[140%] tracking-[0] text-blackFive">
                    {email.reason}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <h3 className="mb-3 text-[18px] font-semibold leading-[100%] tracking-[0] text-black">
                {t('inbox.detail.attachments')}
              </h3>
              <InboxAttachmentsTable
                attachments={contextAttachments}
                downloadingAttachmentId={downloadingAttachmentId}
                onDownload={handleDownloadAttachment}
              />
            </div>
          </div>
        </div>
      </div>

      {isProcessed && (
        <>
          <h2 className="mb-2 text-[18px] font-semibold leading-[100%] mt-2 tracking-[0] text-black">
            {t('inbox.detail.processedShipments')}
          </h2>
          <InboxProcessedShipmentsTable
            rows={email.shipments}
            onConvertToUnprocessed={handleConvertToUnprocessable}
            onDownloadAttachment={handleDownloadAttachment}
            convertingIndex={convertingProcessableIndex}
          />

          <h2 className="mb-2 mt-2 text-[18px] font-semibold leading-[100%] tracking-[0] text-black">
            {t('inbox.detail.unprocessedShipments')}
          </h2>
          <InboxUnprocessedShipmentsTable
            rows={email.unprocessedShipments}
            onConvertToProcessable={handleConvertToProcessable}
            convertingIndex={convertingUnprocessableIndex}
          />
        </>
      )}
    </section>
  )
}
