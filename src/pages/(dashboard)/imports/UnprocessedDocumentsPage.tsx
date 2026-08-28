import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useCreateCrossImportShipmentMutation,
  useGetM365UnprocessedDocumentsQuery,
} from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
import { InboxUnprocessedShipmentsTable } from '@/pages/(dashboard)/inbox/components/inbox-unprocessed-shipments-table'
import { getUnprocessableStatusLabel } from '@/pages/(dashboard)/inbox/inbox-mappers'
import type { InboxUnprocessedShipmentRow } from '@/pages/(dashboard)/inbox/types'
import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import type { M365UnprocessedDocumentsJob } from '@/types/recovery-m365-api'

import { ImportActionCard, NoImportsIcon } from './import-action-card'
import {
  CrossImportCreateShipmentModal,
  type CrossImportShipmentSubmitPayload,
} from './cross-import-create-shipment-modal'

const PAGE_SIZE = 10
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
 * Every unprocessable document from EVERY import job, in one selectable list.
 *
 * ## Why this is not the import-job detail screen with a wider query
 *
 * The per-job screen (`import-detail-shipments.tsx`) renders one recovery
 * document, so a row there is an index into that document's `unprocessable[]`.
 * Here rows come from many documents at once, so a row's identity is
 * `documentId` + `index` — and that is exactly what makes cross-import pairing
 * possible: a C88 fetched by one import can be paired with a CI fetched by
 * another. The backend flattens and paginates the rows (`$unwind` preserves
 * each element's original index), so nothing is aggregated client-side.
 *
 * Selection is held as a map keyed by row id rather than a list of ticked
 * indices, so it survives paging, searching and filtering — picking one file on
 * page 1 and its counterpart on page 3 is the normal case, not an edge case.
 */
export function UnprocessedDocumentsPage() {
  const { t } = useI18n()

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [importJobId, setImportJobId] = useState('')
  // Rows whose pairing request is still in flight. Hidden from the table so the
  // same file can't be submitted twice; restored if the request fails.
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [createCrossImportShipment] = useCreateCrossImportShipmentMutation()
  const navigate = useNavigate()

  // Debounced search. Page 1 is forced alongside it — any narrowing of the list
  // invalidates the current page number, since page 4 of an unfiltered list is
  // usually past the end of a filtered one. The ref keeps that reset tied to a
  // real change in the applied term, so typing and deleting a character back to
  // where it started does not knock the user off their page.
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

  const { data, isFetching, isError } = useGetM365UnprocessedDocumentsQuery(
    {
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(importJobId ? { importJobId } : {}),
    },
    { refetchOnMountOrArgChange: true },
  )

  const content = data?.content
  const pendingIdSet = useMemo(() => new Set(pendingIds), [pendingIds])
  const rows = useMemo(
    () => (content?.items ?? []).filter((row) => !pendingIdSet.has(row.id)),
    [content, pendingIdSet],
  )
  const importJobs = content?.importJobs ?? []
  const isFiltered = Boolean(search || importJobId)
  const total = content?.total ?? 0
  const totalPages = Math.max(1, content?.totalPages ?? 1)

  /**
   * Rows for the shared Inbox table. `sourceIndex` is the position within the
   * OWNING document, not within this page — nothing here acts on it (no retry,
   * no convert), and keeping the real value avoids inventing a coordinate that
   * would be wrong if it were ever used.
   */
  const tableRows: InboxUnprocessedShipmentRow[] = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        sourceIndex: row.index,
        fileName: row.filename,
        type: row.type,
        status: getUnprocessableStatusLabel(row.failureReasonCode),
        statusDetail: row.summary ?? row.failureReasonCode ?? undefined,
        s3Key: row.s3Key ?? undefined,
      })),
    [rows],
  )

  /**
   * The modal pairs across imports AND across pages, so it cannot be limited to
   * the rows currently on screen. This second request pulls the whole filtered
   * set (capped server-side at 200) and only runs while the modal is open.
   */
  const { data: allData, isFetching: isAllFetching } = useGetM365UnprocessedDocumentsQuery(
    {
      page: 1,
      limit: 200,
      ...(search ? { search } : {}),
      ...(importJobId ? { importJobId } : {}),
    },
    { skip: !isModalOpen },
  )
  const modalRows = useMemo(
    () => (allData?.content?.items ?? []).filter((row) => !pendingIdSet.has(row.id)),
    [allData, pendingIdSet],
  )

  const handleSubmit = ({ title, ciRow, c88Row }: CrossImportShipmentSubmitPayload) => {
    if (!ciRow.s3Key || !c88Row.s3Key) return
    const pair = [ciRow.id, c88Row.id]
    setPendingIds((prev) => [...prev, ...pair])

    createCrossImportShipment({
      title,
      ci: { documentId: ciRow.documentId, index: ciRow.index, s3Key: ciRow.s3Key },
      c88: { documentId: c88Row.documentId, index: c88Row.index, s3Key: c88Row.s3Key },
    })
      .unwrap()
      .then(() => {
        showCustomToast({
          type: 'success',
          title: 'Success',
          message: t('imports.unprocessed.modal.success'),
        })
      })
      .catch((error) => {
        showCustomToast({ type: 'error', title: 'Error', message: getRtkErrorMessage(error) })
      })
      .finally(() => {
        setPendingIds((prev) => prev.filter((id) => !pair.includes(id)))
      })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-rp-heading">
            {t('imports.unprocessed.sectionTitle')}
          </h1>
          {total > 0 ? (
            <span className="inline-flex size-[25px] items-center justify-center rounded-full bg-rp-accent text-xs font-semibold text-white">
              {total}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <ShipmentsSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder={t('imports.unprocessed.searchPlaceholder')}
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

        <Button
          variant="default"
          size="sm"
          disabled={rows.length === 0}
          onClick={() => setIsModalOpen(true)}
        >
          {t('imports.unprocessed.createShipment')}
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-redOne">{t('imports.unprocessed.loadError')}</p>
      ) : isFetching ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <CustomLoader />
        </div>
      ) : rows.length === 0 ? (
        // Two distinct empty states: "you have nothing" and "your filters match
        // nothing" need different words and different exits — offering "clear
        // filters" when there is genuinely no data sends the user in a circle.
        <div className="flex flex-1 items-center justify-center py-10">
          {isFiltered ? (
            <ImportActionCard
              icon={<NoImportsIcon />}
              title={t('imports.unprocessed.emptyFilteredTitle')}
              description={t('imports.unprocessed.emptyFiltered')}
              actionLabel={t('imports.unprocessed.clearFilters')}
              onAction={() => {
                setSearchInput('')
                setSearch('')
                appliedSearchRef.current = ''
                setImportJobId('')
                setPage(1)
              }}
            />
          ) : (
            <ImportActionCard
              icon={<NoImportsIcon />}
              title={t('imports.unprocessed.emptyTitle')}
              description={t('imports.unprocessed.empty')}
              actionLabel={t('imports.unprocessed.emptyAction')}
              onAction={() => navigate('/imports')}
            />
          )}
        </div>
      ) : (
        // Icon only, matching the Figma Actions column — no retry endpoint wired for
        // cross-import rows.
        <InboxUnprocessedShipmentsTable
          rows={tableRows}
          scrollWrapperClassName=""
          onRetry={() => {}}
        />
      )}

      {totalPages > 1 ? (
        <CustomPagination
          totalPages={totalPages}
          currentPage={Math.min(page, totalPages)}
          onPageChange={setPage}
        />
      ) : null}

      {isModalOpen ? (
        <CrossImportCreateShipmentModal
          rows={modalRows}
          isLoading={isAllFetching && modalRows.length === 0}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}
