import { useEffect, useMemo, useState } from 'react'

import {
  useDecideCompanyDeleteRequestMutation,
  useListCompanyDeleteRequestsQuery,
} from '@/app/services/recoveryCompanyUsersApi'
import { CsvExportButton } from '@/components/buttons'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { MU } from '@/lib/manage-users-copy'
import { getReportStatusStyle, getReportStatusText } from '@/lib/manage-users-table-helper'
import { showCustomToast } from '@/lib/showCustomToast'
import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import type { CompanyDeleteRequest } from '@/types/recovery-company-users-api'

import { DeleteRequestActionMenu } from './delete-request-action-menu'
import { DeleteRequestConfirmModal } from './delete-request-confirm-modal'
import {
  DeleteRequestStatusFilter,
  type DeleteRequestStatusFilterValue,
} from './delete-request-status-filter'

/**
 * The Company Owner's deletion-request queue.
 *
 * Mirrors the admin deletion-requests screen — search, status filter,
 * select-all, CSV export, pagination, status pills — so the two review
 * surfaces read alike. A Company User's request comes here; the owner's own
 * goes to the platform admin instead, which is why an owner never sees
 * themselves listed.
 *
 * Approving suspends the account immediately, matching the admin decision
 * path, so the confirmation dialog says so rather than implying a reversible
 * step — and every approve/reject goes through that dialog before the
 * mutation fires, same as admin's confirm popup.
 */
const PAGE_SIZE = 10

const HEADINGS = ['', 'Name', 'Email', MU.requestedAt, MU.deleteRequestReason, 'Status', 'Actions']

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : 'N/A'

export function CompanyDeleteRequestsCard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeleteRequestStatusFilterValue>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmModal, setConfirmModal] = useState<{
    intent: 'approve' | 'reject'
    request: CompanyDeleteRequest
  } | null>(null)
  const [isDeciding, setIsDeciding] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isFetching, isError, refetch } = useListCompanyDeleteRequestsQuery(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    // Revisiting this route (nav away and back) should always show current
    // data, not whatever RTK Query still has cached from last time.
    { refetchOnMountOrArgChange: true },
  )
  const [decide] = useDecideCompanyDeleteRequestMutation()

  const requests = useMemo(() => data?.content?.data ?? [], [data])
  const totalPages = Math.max(1, data?.content?.totalPages ?? 1)

  const isAllSelected =
    requests.length > 0 && requests.every((request) => selectedIds.includes(request._id))

  const handleSelectAll = () => {
    const visibleIds = requests.map((request) => request._id)
    setSelectedIds((prev) =>
      isAllSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds])),
    )
  }

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const csvData = useMemo(
    () =>
      requests
        .filter((request) => selectedIds.includes(request._id))
        .map((request) => ({
          Name: `${request.firstName} ${request.lastName}`.trim() || 'N/A',
          Email: request.email || 'N/A',
          'Requested At': formatDateTime(request.deletionRequestedAt),
          Reason: request.deletionRequestReason || 'N/A',
          Status: getReportStatusText(request.deletionRequestStatus),
        })),
    [requests, selectedIds],
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: DeleteRequestStatusFilterValue) => {
    setStatusFilter(value)
    setCurrentPage(1)
    setSelectedIds([])
  }

  const handleConfirm = async () => {
    if (!confirmModal) return
    setIsDeciding(true)
    try {
      await decide({ id: confirmModal.request._id, decision: confirmModal.intent }).unwrap()
      showCustomToast({
        type: 'success',
        title: MU.deleteRequestsTitle,
        message:
          confirmModal.intent === 'approve' ? MU.deleteRequestApproved : MU.deleteRequestRejected,
      })
      setConfirmModal(null)
    } catch (err) {
      showCustomToast({
        type: 'error',
        title: MU.deleteRequestsTitle,
        message: getRtkErrorMessage(err),
      })
    } finally {
      setIsDeciding(false)
    }
  }

  const isFiltered = Boolean(debouncedSearch) || statusFilter !== 'all'

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-lg font-semibold text-backTwo">{MU.deleteRequestsTitle}</p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <ShipmentsSearchInput
            id="company-delete-requests-search"
            className="w-full sm:w-[260px]"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <DeleteRequestStatusFilter value={statusFilter} onChange={handleStatusFilterChange} />
        </div>
      </div>

      {isError ? (
        // A failure that renders as an empty queue would quietly hide real
        // requests from the owner.
        <div className="flex flex-col items-start gap-2 rounded-lg border border-bottomBorder p-4">
          <p className="text-sm text-red-700">{MU.deleteRequestsFailed}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-bottomBorder px-3 py-2 text-sm font-medium text-black"
          >
            {MU.retry}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-bottomBorder px-2 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            <CustomCheckboxShipment
              onChange={handleSelectAll}
              isChecked={isAllSelected}
              label={MU.selectAll}
            />
            <CsvExportButton
              isDisabled={selectedIds.length === 0 || csvData.length === 0}
              data={csvData}
              moduleName="Recovery-Delete-Requests"
              buttonText={MU.exportCSV}
            />
          </div>

          {isFetching ? (
            <div className="flex h-[70svh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4 2xl:h-[80svh]">
              <CustomLoader />
            </div>
          ) : requests.length > 0 ? (
            <div className="w-full overflow-hidden rounded-lg border border-bottomBorder">
              <div className="max-h-[70svh] w-full overflow-x-auto overflow-y-auto 2xl:max-h-[80svh]">
                <table className="w-full min-w-[960px] bg-white text-left">
                  <thead className="sticky top-0 z-10 bg-greyFour text-black">
                    <tr className="text-left text-sm font-medium">
                      {HEADINGS.map((title, index) => (
                        <th
                          key={title || `col-${index}`}
                          className="whitespace-nowrap p-3 text-xs font-normal sm:text-sm"
                        >
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request._id}
                        className="border-b border-bottomBorder text-xsmall text-black transition last:border-b-0 hover:bg-[var(--hover-color)]"
                      >
                        <td className="w-10 p-3">
                          <CustomCheckboxShipment
                            onChange={() => handleSelect(request._id)}
                            isChecked={selectedIds.includes(request._id)}
                          />
                        </td>
                        <td className="max-w-[160px] truncate p-3 font-medium sm:max-w-[200px] md:max-w-[240px]">
                          <span title={`${request.firstName} ${request.lastName}`.trim()}>
                            {`${request.firstName} ${request.lastName}`.trim() || 'N/A'}
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate p-3 sm:max-w-[200px] md:max-w-[280px]">
                          <span title={request.email}>{request.email}</span>
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {formatDateTime(request.deletionRequestedAt)}
                        </td>
                        <td className="max-w-[200px] truncate p-3 sm:max-w-[260px]">
                          <span title={request.deletionRequestReason ?? undefined}>
                            {request.deletionRequestReason || 'N/A'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-3">
                          <span
                            className={`flex w-fit items-center gap-2 rounded-md px-3 py-1 text-xs font-medium sm:text-sm ${getReportStatusStyle(
                              request.deletionRequestStatus,
                            )}`}
                          >
                            <span className="h-1.5 min-w-1.5 rounded-full bg-current" />
                            {getReportStatusText(request.deletionRequestStatus)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {request.deletionRequestStatus === 'pending' ? (
                            <DeleteRequestActionMenu
                              options={['approve', 'reject']}
                              onSelect={(action) => setConfirmModal({ intent: action, request })}
                            />
                          ) : (
                            <span className="text-xs text-lightBlackOne">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-[50svh] w-full flex-col items-center justify-center gap-3 p-4">
              <p className="max-w-lg p-4 text-center text-black">
                {isFiltered ? MU.deleteRequestsEmptyFiltered : MU.deleteRequestsEmpty}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      <DeleteRequestConfirmModal
        open={confirmModal !== null}
        intent={confirmModal?.intent ?? 'approve'}
        requesterName={
          confirmModal
            ? `${confirmModal.request.firstName} ${confirmModal.request.lastName}`.trim()
            : ''
        }
        isSubmitting={isDeciding}
        onConfirm={() => void handleConfirm()}
        onClose={() => setConfirmModal(null)}
      />
    </section>
  )
}
