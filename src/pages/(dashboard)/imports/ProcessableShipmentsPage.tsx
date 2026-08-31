import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useGetRecoveryDownloadUrlMutation } from '@/app/services/recoveryApi'
import { useGetRecoveryShipmentsListQuery } from '@/app/services/recoveryApi'
import { useGetM365ProcessableShipmentsQuery } from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { toManageShipmentsTableRow } from '@/lib/manage-shipments-row'
import { showCustomToast } from '@/lib/showCustomToast'
import { InboxProcessedShipmentsTable } from '@/pages/(dashboard)/inbox/components/inbox-processed-shipments-table'
import type { InboxAttachment, InboxShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { AllShipmentsDataTable } from '@/pages/(dashboard)/shipments/components/all-shipments-data-table'
import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import type {
  M365ProcessableShipment,
  M365ProcessableShipmentFile,
  M365UnprocessedDocumentsJob,
} from '@/types/recovery-m365-api'

import { ImportActionCard, NoImportsIcon } from './import-action-card'

const DOCUMENTS_PAGE_SIZE = 6
const SHIPMENTS_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

function importLabel(row: { folderNames: string[]; mailboxEmail: string | null }): string {
  if (row.folderNames.length > 0) return row.folderNames.join(', ')
  return row.mailboxEmail ?? '-'
}

function jobOptionLabel(job: M365UnprocessedDocumentsJob): string {
  const date = job.importedAt ? new Date(job.importedAt) : null
  const dateLabel = date && !Number.isNaN(date.getTime()) ? ` — ${date.toLocaleDateString()}` : ''
  return `${importLabel(job)}${dateLabel}`
}

/**
 * One side of a pair as the shared table wants it. The id is `${rowId}:${side}`
 * so a download callback can resolve back to the document that owns the file —
 * `InboxAttachment` has no field for that.
 */
function toInboxAttachment(
  row: M365ProcessableShipment,
  side: 'c88' | 'po',
): InboxAttachment | null {
  const file: M365ProcessableShipmentFile = side === 'c88' ? row.c88 : row.po
  if (!file.filename) {
    return null
  }
  return {
    id: `${row.id}:${side}`,
    name: file.filename,
    size: file.contentType ?? '',
    status: 'passed',
    s3Key: file.s3Key ?? undefined,
    bucket: file.bucket ?? undefined,
    recordType: 'processed',
  }
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

/**
 * The Imports section's processable view: the paired documents from every
 * import, and the shipments those pairs became.
 *
 * ## Why two tables and not one
 *
 * They answer different questions and come from different places. "Processed
 * Documents" is the pairing itself — one row per C88 + CI, read from the
 * import-job documents, with links to the two files. "Processed Shipments" is
 * what those pairs turned into: real `RecoveryShipment` records with a status, a
 * ship-via and a landed-cost trail, read from the shipments endpoint filtered to
 * import-produced ones. A pair can exist without its shipment (the extraction
 * gate is not satisfied yet), which is exactly why collapsing the two would hide
 * a real state.
 *
 * The second table reuses `AllShipmentsDataTable` rather than reimplementing it,
 * so a row here behaves identically to the same row on All Shipments.
 *
 * Shipments the user created by hand on the Unprocessed Documents screen need no
 * special handling in either table — the backend stores a manual pair on the C88
 * side's import-job document, so it is the same kind of row as an automatic one.
 */
export function ProcessableShipmentsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [importJobId, setImportJobId] = useState('')
  const [shipmentsPage, setShipmentsPage] = useState(1)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const [getRecoveryDownloadUrl] = useGetRecoveryDownloadUrlMutation()

  // Debounced search, resetting to page 1 only on a real change in the applied
  // term — see the Unprocessed Documents screen for the same reasoning.
  const appliedSearchRef = useRef('')
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      if (next === appliedSearchRef.current) {
        return
      }
      appliedSearchRef.current = next
      setSearch(next)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isFetching, isError } = useGetM365ProcessableShipmentsQuery(
    {
      page,
      limit: DOCUMENTS_PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(importJobId ? { importJobId } : {}),
    },
    { refetchOnMountOrArgChange: true },
  )

  // Only import-produced shipments belong in the Imports section. The filter is
  // a messageId prefix server-side — shipments carry no source field.
  const { data: shipmentsData, isFetching: isShipmentsFetching } = useGetRecoveryShipmentsListQuery(
    { source: 'm365-import', page: shipmentsPage, limit: SHIPMENTS_PAGE_SIZE },
    { refetchOnMountOrArgChange: true },
  )

  const content = data?.content
  const rows = useMemo(() => content?.items ?? [], [content])
  const importJobs = content?.importJobs ?? []
  const total = content?.total ?? 0
  const totalPages = Math.max(1, content?.totalPages ?? 1)
  const isFiltered = Boolean(search || importJobId)

  const shipmentRows = useMemo(
    () => (shipmentsData?.content?.data ?? []).map(toManageShipmentsTableRow),
    [shipmentsData],
  )
  const shipmentsTotalPages = Math.max(1, shipmentsData?.content?.totalPages ?? 1)

  /**
   * Rows for the shared Inbox processed table.
   *
   * That table hands its callbacks an `InboxAttachment` / `InboxShipmentRow`,
   * neither of which carries the owning document id — and the download call
   * needs one. So the attachment id encodes the row it came from, and the two
   * maps below resolve a callback argument back to the data it needs. Encoding
   * beats a parallel array: rows get filtered and re-sorted, indices do not
   * survive that.
   */
  const documentRows: InboxShipmentRow[] = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        sourceIndex: row.index,
        title: row.title ?? '-',
        date: formatDate(row.date),
        c88: toInboxAttachment(row, 'c88'),
        po: toInboxAttachment(row, 'po'),
      })),
    [rows],
  )

  const shipmentIdByRow = useMemo(
    () => new Map(rows.map((row) => [row.id, row.shipmentId])),
    [rows],
  )
  const documentIdByAttachment = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of rows) {
      map.set(`${row.id}:c88`, row.documentId)
      map.set(`${row.id}:po`, row.documentId)
    }
    return map
  }, [rows])

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    appliedSearchRef.current = ''
    setImportJobId('')
    setPage(1)
  }

  /**
   * Presigns and hands the file to the browser. One at a time: the URL is
   * delivered via a location change, so two in flight would race for it.
   */
  const handleDownloadAttachment = async (attachment: InboxAttachment) => {
    const documentId = documentIdByAttachment.get(attachment.id)
    if (!documentId || !attachment.s3Key || !attachment.bucket || downloadingId) {
      return
    }
    try {
      setDownloadingId(attachment.id)
      const response = await getRecoveryDownloadUrl({
        id: documentId,
        s3Key: attachment.s3Key,
        bucket: attachment.bucket,
        // Paired files always live as processed records; an import has no
        // quarantine path into it.
        recordType: 'processed',
        fileName: attachment.name,
      }).unwrap()
      const downloadUrl = response?.content?.downloadUrl
      if (!downloadUrl) {
        throw new Error('Download URL is not available.')
      }
      window.location.href = downloadUrl
    } catch (error) {
      showCustomToast({ type: 'error', title: 'Error', message: getRtkErrorMessage(error) })
    } finally {
      setTimeout(() => setDownloadingId(null), 1000)
    }
  }

  return (
    // No overflow-y-auto/min-h-0 here — DashboardLayout's <main> is already the
    // page's scroll container. Nesting a second one here just adds an extra
    // (invisible-scrollbar) flex-shrink layer between the content and the one
    // scrollport that actually needs to move to reach Processed Shipments' rows.
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-rp-heading">
            {t('imports.processable.documents')}
          </h1>
          {total > 0 ? (
            <span className="inline-flex size-[25px] items-center justify-center rounded-full bg-rp-accent text-xs font-semibold text-white">
              {total}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ShipmentsSearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t('imports.processable.searchPlaceholder')}
          className="sm:max-w-xs"
          inputWidthClass="w-full"
        />
        <select
          value={importJobId}
          onChange={(e) => {
            setImportJobId(e.target.value)
            setPage(1)
          }}
          aria-label={t('imports.unprocessed.col.import')}
          className="h-10 rounded-lg border border-rp-border bg-white px-3 text-sm text-rp-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-accent sm:max-w-xs"
        >
          <option value="">{t('imports.unprocessed.allImports')}</option>
          {importJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {jobOptionLabel(job)}
            </option>
          ))}
        </select>
      </div>

      {isFetching || isShipmentsFetching ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <CustomLoader />
        </div>
      ) : (
        <>
          {isError ? (
            <p className="text-sm text-redOne">{t('imports.processable.loadError')}</p>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              {isFiltered ? (
                <ImportActionCard
                  icon={<NoImportsIcon />}
                  title={t('imports.unprocessed.emptyFilteredTitle')}
                  description={t('imports.processable.emptyFiltered')}
                  actionLabel={t('imports.unprocessed.clearFilters')}
                  onAction={clearFilters}
                />
              ) : (
                <ImportActionCard
                  icon={<NoImportsIcon />}
                  title={t('imports.processable.emptyTitle')}
                  description={t('imports.processable.empty')}
                  actionLabel={t('imports.processable.emptyAction')}
                  onAction={() => navigate('/imports/unprocessed-documents')}
                />
              )}
            </div>
          ) : (
            <>
              <InboxProcessedShipmentsTable
                rows={documentRows}
                onDownloadAttachment={handleDownloadAttachment}
                onViewShipment={(row) => {
                  const shipmentId = shipmentIdByRow.get(row.id)
                  if (shipmentId) {
                    navigate(`/shipments/${shipmentId}`)
                  }
                }}
                isViewDisabled={(row) => !shipmentIdByRow.get(row.id)}
                // Page size is capped to DOCUMENTS_PAGE_SIZE (6), so the inner
                // scrollbox is unnecessary — let the page itself scroll instead.
                scrollWrapperClassName="w-full overflow-x-auto"
              />

              {totalPages > 1 ? (
                <CustomPagination
                  totalPages={totalPages}
                  currentPage={Math.min(page, totalPages)}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-rp-heading">
              {t('imports.processable.shipments')}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/shipments')}
              className="text-sm text-yellow underline underline-offset-2"
            >
              {t('imports.processable.viewAll')}
            </button>
          </div>

          {shipmentRows.length === 0 ? (
            <p className="text-base font-light text-blackFive">
              {t('imports.processable.shipmentsEmpty')}
            </p>
          ) : (
            <>
              <AllShipmentsDataTable
                data={shipmentRows}
                selectedUserIds={[]}
                onCheckChange={() => {}}
                // Bulk selection belongs to All Shipments, which owns the bulk
                // actions bar. This is a read-only view onto the same rows.
                showCheckboxColumn={false}
                showDateSplit
                // No internal vertical scroll box — all 10 rows render at full
                // height and the page itself scrolls to reveal them.
                scrollWrapperClassName="w-full overflow-x-auto"
              />
              {shipmentsTotalPages > 1 ? (
                <CustomPagination
                  totalPages={shipmentsTotalPages}
                  currentPage={Math.min(shipmentsPage, shipmentsTotalPages)}
                  onPageChange={setShipmentsPage}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  )
}
