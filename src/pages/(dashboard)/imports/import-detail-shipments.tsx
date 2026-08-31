import { useMemo, useState } from 'react'

import { useGetRecoveryDownloadUrlMutation } from '@/app/services/recoveryApi'
import { useCreateManualShipmentMutation } from '@/app/services/recoveryDocumentActionsApi'
import { useGetM365ImportJobShipmentsQuery } from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import { CreateShipmentModal } from '@/pages/(dashboard)/inbox/components/create-shipment-modal'
import type { CreateShipmentSubmitPayload } from '@/pages/(dashboard)/inbox/components/create-shipment-modal'
import { InboxInProcessingShipmentsTable } from '@/pages/(dashboard)/inbox/components/inbox-in-processing-shipments-table'
import { InboxProcessedShipmentsTable } from '@/pages/(dashboard)/inbox/components/inbox-processed-shipments-table'
import { InboxUnprocessedShipmentsTable } from '@/pages/(dashboard)/inbox/components/inbox-unprocessed-shipments-table'
import { mapRecoveryDocumentToInboxEmail } from '@/pages/(dashboard)/inbox/inbox-mappers'
import type { InboxAttachment, InboxInProcessingShipmentRow } from '@/pages/(dashboard)/inbox/types'

export type ImportDetailShipmentsProps = {
  jobId: string
  /**
   * True while the job is queued/running/retrying. The backend only pairs
   * documents once a job reaches a terminal status, so there is deliberately
   * nothing to fetch before then.
   */
  isJobActive: boolean
}

type PendingShipment = InboxInProcessingShipmentRow & {
  ciSourceIndex: number
  c88SourceIndex: number
}

/**
 * The import job's Processable / In Processing / Unprocessable shipment sections.
 *
 * ## Why this looks so much like the Inbox detail panel
 *
 * The backend stores ONE recovery document per import job rather than one per
 * email, so a single fetch returns the job's whole processable/unprocessable set
 * already unified across every email in the import — no client-side aggregation.
 * Because that payload is the same shape the Inbox detail endpoint returns, the
 * Inbox's mapper, its three tables and its Create Shipment modal are reused
 * verbatim here, and the row actions hit the same
 * `/recovery/documents/:id/...` endpoints. Keep it that way: divergence here
 * means two implementations of one flow.
 *
 * ## What is intentionally absent
 *
 * No Retry action and no move-between-lists actions — those exist in the Inbox
 * but were scoped out here. `InboxUnprocessedShipmentsTable` renders its row
 * menu only when an `onRetry` handler is passed, so omitting the prop is what
 * hides it.
 */
export function ImportDetailShipments({ jobId, isJobActive }: ImportDetailShipmentsProps) {
  const { t } = useI18n()
  const [createManualShipment] = useCreateManualShipmentMutation()
  const [getRecoveryDownloadUrl] = useGetRecoveryDownloadUrlMutation()

  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false)
  // Which attachment's presign is currently in flight. Used to ignore repeat
  // clicks: the presigned URL is handed to the browser via a location change, so
  // firing two overlapping requests would race for the navigation.
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null)
  // Create Shipment requests that were submitted but haven't resolved yet. Held
  // here rather than in the modal so the request survives the modal closing —
  // the modal unmounts immediately on submit, and nothing else stays mounted for
  // the mutation's whole lifetime.
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([])

  const {
    data,
    isFetching,
    isError,
    refetch: refetchShipments,
  } = useGetM365ImportJobShipmentsQuery(jobId, {
    skip: !jobId || isJobActive,
    // Pairing finishes server-side after the job completes, so a cached payload
    // from an earlier visit can predate it.
    refetchOnMountOrArgChange: true,
  })

  const record = data?.content ?? null
  const document = useMemo(
    () => (record ? mapRecoveryDocumentToInboxEmail(record) : null),
    [record],
  )
  const documentId = document?.id ?? null

  const claimedSourceIndexes = useMemo(
    () => new Set(pendingShipments.flatMap((item) => [item.ciSourceIndex, item.c88SourceIndex])),
    [pendingShipments],
  )
  // Two exclusions, both applied AFTER mapping so `sourceIndex` still points at
  // the row's real position in the document's `unprocessable[]` — that index is
  // the coordinate create-shipment addresses a file by, and filtering the array
  // before it is assigned would silently renumber every row after the gap.
  //
  // 1. Rows claimed by an in-flight request, so the same file can't be
  //    submitted twice. On failure the pending entry is dropped and they
  //    reappear on their own.
  // 2. Rows whose bytes were never stored (`s3Key` null — an import that ran
  //    against a broken S3 config records the metadata anyway, by design, since
  //    the upload failure is non-fatal). Pairing re-reads each side from its
  //    key server-side, so these can never be actioned; listing them produced a
  //    full table whose Create Shipment modal then reported that nothing was
  //    selectable, because the modal filters on the field the table ignored.
  const visibleUnprocessed = useMemo(
    () =>
      (document?.unprocessedShipments ?? []).filter(
        (row) => !claimedSourceIndexes.has(row.sourceIndex) && Boolean(row.s3Key),
      ),
    [document, claimedSourceIndexes],
  )

  /**
   * Fires the mutation in the background and returns immediately — the modal has
   * already validated the input and closed itself by the time this runs. The
   * request's lifecycle is tracked through `pendingShipments` rather than the
   * mutation hook's loading flag.
   */
  const handleCreateShipmentSubmit = ({
    title,
    ciRow,
    c88Row,
    plRow,
  }: CreateShipmentSubmitPayload) => {
    if (!documentId || !ciRow.s3Key || !c88Row.s3Key) {
      return
    }
    const key = `${documentId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    setPendingShipments((prev) => [
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
        // The backend has already moved these files into the new shipment —
        // refetching is what surfaces it under Processable Shipments.
        await refetchShipments()
      })
      .catch((error) => {
        // Nothing changed server-side on failure — once the pending entry below
        // is removed, these rows reappear under Unprocessable on their own.
        showCustomToast({
          type: 'error',
          title: 'Error',
          message: getRtkErrorMessage(error),
        })
      })
      .finally(() => {
        setPendingShipments((prev) => prev.filter((item) => item.id !== key))
      })
  }

  const handleDownloadAttachment = async (attachment: InboxAttachment) => {
    if (!documentId || downloadingAttachmentId) {
      return
    }
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
      const response = await getRecoveryDownloadUrl({
        id: documentId,
        s3Key: attachment.s3Key,
        bucket: attachment.bucket,
        // Import-job documents are always stored as processed records; there is
        // no quarantine path into an import.
        recordType: attachment.recordType ?? 'processed',
        fileName: s3KeyFileName || attachment.name,
      }).unwrap()
      const downloadUrl = response?.content?.downloadUrl
      if (!downloadUrl) {
        throw new Error('Download URL is not available.')
      }
      window.location.href = downloadUrl
    } catch (error) {
      showCustomToast({
        type: 'error',
        title: 'Error',
        message: getRtkErrorMessage(error),
      })
    } finally {
      setTimeout(() => setDownloadingAttachmentId(null), 1000)
    }
  }

  // Keeps the section list stable while the loader/empty states render, so the
  // page doesn't reflow as the request resolves.
  const heading = (label: string) => (
    <h2 className="text-lg font-semibold text-rp-heading">{label}</h2>
  )

  if (isJobActive) {
    return (
      <section className="flex flex-col gap-3 rounded-[10px] border border-rp-border bg-rp-page p-5">
        {heading(t('imports.shipments.title'))}
        <p className="text-sm text-rp-muted">{t('imports.shipments.pendingJob')}</p>
      </section>
    )
  }

  if (isFetching && !record) {
    return (
      <section className="flex flex-col gap-3 rounded-[10px] border border-rp-border bg-rp-page p-5">
        {heading(t('imports.shipments.title'))}
        <div className="flex justify-center py-6">
          <CustomLoader />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-3 rounded-[10px] border border-rp-border bg-rp-page p-5">
        {heading(t('imports.shipments.title'))}
        <p className="text-sm text-redOne">{t('imports.shipments.loadError')}</p>
      </section>
    )
  }

  if (!document) {
    return (
      <section className="flex flex-col gap-3 rounded-[10px] border border-rp-border bg-rp-page p-5">
        {heading(t('imports.shipments.title'))}
        <p className="text-sm text-rp-muted">{t('imports.shipments.empty')}</p>
      </section>
    )
  }

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        {heading(t('imports.shipments.processable'))}
        <InboxProcessedShipmentsTable
          rows={document.shipments}
          onDownloadAttachment={handleDownloadAttachment}
        />
      </div>

      {pendingShipments.length > 0 ? (
        <div className="flex w-full flex-col gap-3">
          {heading(t('imports.shipments.inProcessing'))}
          <InboxInProcessingShipmentsTable rows={pendingShipments} />
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {heading(t('imports.shipments.unprocessable'))}
          {visibleUnprocessed.length > 0 ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateShipmentOpen(true)}
              disabled={!documentId}
            >
              {t('inbox.createShipment.button')}
            </Button>
          ) : null}
        </div>
        {/*
          No Actions column here. The per-row Retry action belongs to the Inbox,
          which has a retry endpoint for a single email's attachments; an import
          job has no equivalent, so the column rendered controls that could not
          do anything. Pairing from this screen happens through Create Shipment
          above, not per row.
        */}
        <InboxUnprocessedShipmentsTable rows={visibleUnprocessed} hideActionsColumn />
      </div>

      {isCreateShipmentOpen ? (
        <CreateShipmentModal
          rows={visibleUnprocessed}
          onClose={() => setIsCreateShipmentOpen(false)}
          onSubmit={handleCreateShipmentSubmit}
        />
      ) : null}
    </>
  )
}
