import { useState } from 'react'

import { CustomLoader } from '@/components/feedback/custom-loader'
import {
  useGetRecoveryDownloadUrlMutation,
  useMoveProcessableToUnprocessableMutation,
  useMoveUnprocessableToProcessableMutation,
} from '@/app/services/recoveryApi'
import {
  useCreateManualShipmentMutation,
  useRetryUnprocessableMutation,
} from '@/app/services/recoveryDocumentActionsApi'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import { cn } from '@/lib/utils'
import type {
  InboxAttachment,
  InboxEmail,
  InboxInProcessingShipmentRow,
  InboxUnprocessedShipmentRow,
} from '@/pages/(dashboard)/inbox/types'

import { CreateShipmentModal } from './create-shipment-modal'
import type { CreateShipmentSubmitPayload } from './create-shipment-modal'
import { InboxAttachmentsTable } from './inbox-attachments-table'
import { InboxInProcessingShipmentsTable } from './inbox-in-processing-shipments-table'
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
  const [retryUnprocessable] = useRetryUnprocessableMutation()
  const [createManualShipment] = useCreateManualShipmentMutation()
  const [convertingProcessableIndex, setConvertingProcessableIndex] = useState<number | null>(null)
  const [convertingUnprocessableIndex, setConvertingUnprocessableIndex] = useState<number | null>(
    null,
  )
  const [retryingUnprocessableIndex, setRetryingUnprocessableIndex] = useState<number | null>(null)
  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false)
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null)
  // Manual "Create Shipment" requests that were submitted but haven't resolved yet.
  // Kept here (not in the modal) so the request survives the modal closing — see
  // handleCreateShipmentSubmit below and docs/retry-and-manual-shipment-creation.md.
  // Not scoped to the currently-selected email: switching emails must not abandon an
  // in-flight request started against a different one.
  const [inProcessingShipments, setInProcessingShipments] = useState<
    (InboxInProcessingShipmentRow & { ciSourceIndex: number; c88SourceIndex: number })[]
  >([])
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

  const handleRetryUnprocessable = async (row: InboxUnprocessedShipmentRow) => {
    if (!email) return
    if (!row.s3Key) {
      showCustomToast({
        type: 'error',
        title: 'Error',
        message: 'Missing file reference for this item. Please refresh and try again.',
      })
      return
    }
    try {
      setRetryingUnprocessableIndex(row.sourceIndex)
      await retryUnprocessable({
        id: email.id,
        targets: [{ index: row.sourceIndex, s3Key: row.s3Key }],
      }).unwrap()
      showCustomToast({
        type: 'success',
        title: 'Success',
        message: t('inbox.actions.retrySuccess'),
      })
      await onInboxUpdated?.()
    } catch (error) {
      showCustomToast({
        type: 'error',
        title: 'Error',
        message: getRtkErrorMessage(error),
      })
    } finally {
      setRetryingUnprocessableIndex(null)
    }
  }

  /**
   * Fires the Create Shipment mutation in the background and returns immediately —
   * the modal has already validated the input and closed itself by the time this
   * runs. The request's lifecycle is tracked entirely through `inProcessingShipments`
   * rather than a mutation-hook loading flag, since no component stays mounted for
   * the mutation's whole lifetime otherwise.
   */
  const handleCreateShipmentSubmit = ({
    title,
    ciRow,
    c88Row,
    plRow,
  }: CreateShipmentSubmitPayload) => {
    if (!email || !ciRow.s3Key || !c88Row.s3Key) return
    const documentId = email.id
    const key = `${documentId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    setInProcessingShipments((prev) => [
      ...prev,
      {
        id: key,
        documentId,
        title,
        ciFileName: ciRow.fileName,
        c88FileName: c88Row.fileName,
        ciSourceIndex: ciRow.sourceIndex,
        c88SourceIndex: c88Row.sourceIndex,
      },
    ])

    createManualShipment({
      id: documentId,
      title,
      ciIndex: ciRow.sourceIndex,
      ciS3Key: ciRow.s3Key,
      c88Index: c88Row.sourceIndex,
      c88S3Key: c88Row.s3Key,
      // Sent only when a packing list was actually picked — the API treats a
      // half-specified pair (index without key, or vice versa) as a bad request.
      ...(plRow?.s3Key ? { plIndex: plRow.sourceIndex, plS3Key: plRow.s3Key } : {}),
    })
      .unwrap()
      .then(async () => {
        showCustomToast({
          type: 'success',
          title: 'Success',
          message: t('inbox.createShipment.success'),
        })
        // Backend has already moved these files into the new shipment — refetching
        // is what actually surfaces it under Processable Shipments.
        await onInboxUpdated?.()
      })
      .catch((error) => {
        // Nothing changed server-side on failure — once the entry below is removed,
        // these rows just reappear under Unprocessable Shipments on their own.
        showCustomToast({
          type: 'error',
          title: 'Error',
          message: getRtkErrorMessage(error),
        })
      })
      .finally(() => {
        setInProcessingShipments((prev) => prev.filter((item) => item.id !== key))
      })
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
        <CustomLoader />
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

  // Scope in-processing entries to the email currently on screen — entries for other
  // emails keep running in the background (the mutation isn't tied to this render),
  // they just aren't shown until that email is selected again.
  const activeInProcessing = inProcessingShipments.filter((item) => item.documentId === email.id)
  const inProcessingSourceIndexes = new Set(
    activeInProcessing.flatMap((item) => [item.ciSourceIndex, item.c88SourceIndex]),
  )
  // Hide rows already claimed by an in-flight Create Shipment request — from both the
  // table and the modal's own dropdowns — so the same file can't be submitted twice.
  // If that request fails, it's removed from inProcessingShipments and these rows
  // reappear here on their own; nothing else needs to move them back.
  const visibleUnprocessedShipments = email.unprocessedShipments.filter(
    (row) => !inProcessingSourceIndexes.has(row.sourceIndex),
  )

  return (
    <section
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6',
        className,
      )}
    >
      <header className="flex shrink-0 flex-col gap-3 rounded-lg border border-bottomBorder px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4">
        <div className="min-w-0 space-y-2">
          <h1
            className="max-w-full truncate text-[18px] font-semibold leading-[100%] tracking-[0] text-black sm:max-w-[420px]"
            title={email.messageId}
          >
            {email.messageId}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-light text-blackFive">
            <span className="break-all">
              <span className="font-medium text-black">{t('inbox.detail.from')}</span>{' '}
              {email.fromAddress}
            </span>
            <span className="break-words">
              <span className="font-medium text-black">{t('inbox.detail.received')}</span>{' '}
              {email.receivedDetail}
            </span>
            <span className="break-all">
              <span className="font-medium text-black">{t('inbox.detail.domain')}</span>{' '}
              {email.domain}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex w-fit items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium',
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

          {activeInProcessing.length > 0 ? (
            <>
              <h2 className="mb-2 mt-2 text-[18px] font-semibold leading-[100%] tracking-[0] text-black">
                {t('inbox.detail.inProcessingShipments')}
              </h2>
              <InboxInProcessingShipmentsTable rows={activeInProcessing} />
            </>
          ) : null}

          <div className="mb-2 mt-2 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold leading-[100%] tracking-[0] text-black">
              {t('inbox.detail.unprocessedShipments')}
            </h2>
            {visibleUnprocessedShipments.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsCreateShipmentOpen(true)}
                className="rounded-md bg-yellow px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                {t('inbox.createShipment.button')}
              </button>
            ) : null}
          </div>
          <InboxUnprocessedShipmentsTable
            rows={visibleUnprocessedShipments}
            onConvertToProcessable={handleConvertToProcessable}
            convertingIndex={convertingUnprocessableIndex}
            onRetry={handleRetryUnprocessable}
            retryingIndex={retryingUnprocessableIndex}
          />
        </>
      )}

      {isCreateShipmentOpen && email ? (
        <CreateShipmentModal
          rows={visibleUnprocessedShipments}
          onClose={() => setIsCreateShipmentOpen(false)}
          onSubmit={handleCreateShipmentSubmit}
        />
      ) : null}
    </section>
  )
}
