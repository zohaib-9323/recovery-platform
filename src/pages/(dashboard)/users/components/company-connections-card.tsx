import { useEffect, useMemo, useState } from 'react'

import { useListCompanyM365StatusQuery } from '@/app/services/recoveryCompanyUsersApi'
import { CsvExportButton } from '@/components/buttons'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomCheckboxShipment } from '@/components/fields/preset/custom-checkbox-shipment'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { MU } from '@/lib/manage-users-copy'
import { ShipmentsSearchInput } from '@/pages/(dashboard)/shipments/components/shipments-search-input'
import type { CompanyConnectionStatusValue } from '@/types/recovery-company-users-api'

/**
 * Microsoft connection status for the owner's team.
 *
 * Mirrors the admin Connections screen (search, select-all, CSV export,
 * status pills, pagination) — same columns, same status pills, same
 * derivation — because the backend serves both from one row builder. Keeping
 * one shape means a status that renders correctly for an admin renders
 * correctly here too.
 *
 * Each user connects their own mailbox, so import jobs and their documents are
 * never shared. This is status only: it exposes no tokens, no import data, and
 * gives the owner no way to act on someone else's mailbox — but a lapsed
 * connection silently stops that person's shipments arriving, which the owner
 * does need to see.
 */
const PAGE_SIZE = 10

const HEADINGS = [
  '',
  'User',
  'User Email',
  'Connected Account',
  'Connection Status',
  'Connected Since',
  'Last Sync',
  'Actions',
]

const STATUS_LABELS: Record<CompanyConnectionStatusValue, string> = {
  connected: 'Connected',
  auth_expired: 'Auth Expired',
  needs_reconnect: 'Needs Reconnect',
  not_connected: 'Not Connected',
}

const STATUS_STYLES: Record<
  CompanyConnectionStatusValue,
  { bg: string; dot: string; text: string }
> = {
  connected: { bg: 'bg-green/10', dot: 'bg-green', text: 'text-green' },
  auth_expired: { bg: 'bg-redOne/10', dot: 'bg-redOne', text: 'text-redOne' },
  needs_reconnect: { bg: 'bg-[#E3A602]/10', dot: 'bg-yellow', text: 'text-yellow' },
  not_connected: { bg: 'bg-greyFour', dot: 'bg-greyOne', text: 'text-greyOne' },
}

/** Blank rather than a misleading epoch date when the field is absent. */
const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : 'N/A'

export function CompanyConnectionsCard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isFetching, isError, refetch } = useListCompanyM365StatusQuery(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
    },
    // Revisiting this route (nav away and back) should always show current
    // data, not whatever RTK Query still has cached from last time.
    { refetchOnMountOrArgChange: true },
  )

  const rows = useMemo(() => data?.content?.items ?? [], [data])
  const totalPages = Math.max(1, data?.content?.totalPages ?? 1)

  const isAllSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.recoveryUserId))

  const handleSelectAll = () => {
    const visibleIds = rows.map((row) => row.recoveryUserId)
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
      rows
        .filter((row) => selectedIds.includes(row.recoveryUserId))
        .map((row) => ({
          User: row.userName || 'N/A',
          Email: row.userEmail,
          'Connected Account': row.connectedAccount || 'N/A',
          'Connection Status': STATUS_LABELS[row.connectionStatus] ?? row.connectionStatus,
          'Connected Since': formatDateTime(row.connectedSince),
          'Last Sync': formatDateTime(row.lastSync),
          'Last Error': row.lastError || '',
        })),
    [rows, selectedIds],
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-lg font-semibold text-backTwo">{MU.connectionsTitle}</p>
        <ShipmentsSearchInput
          id="company-connections-search"
          className="w-full sm:w-[300px]"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {isError ? (
        /*
          A failed request must not render as "no team members" — that reads as
          a true empty state and hides the fault. A wrong request URL previously
          looked identical to a company with nobody in it.
        */
        <div className="flex flex-col items-start gap-2 rounded-lg border border-bottomBorder p-4">
          <p className="text-sm text-red-700">{MU.connectionsFailed}</p>
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
              moduleName="Connection-Status"
              buttonText={MU.exportCSV}
            />
          </div>

          {isFetching ? (
            <div className="flex h-[70svh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4 2xl:h-[80svh]">
              <CustomLoader />
            </div>
          ) : rows.length > 0 ? (
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
                    {rows.map((row) => {
                      const style =
                        STATUS_STYLES[row.connectionStatus] ?? STATUS_STYLES.not_connected
                      return (
                        <tr
                          key={row.recoveryUserId}
                          className="border-b border-bottomBorder text-xsmall text-black transition last:border-b-0 hover:bg-[var(--hover-color)]"
                        >
                          <td className="w-10 p-3">
                            <CustomCheckboxShipment
                              onChange={() => handleSelect(row.recoveryUserId)}
                              isChecked={selectedIds.includes(row.recoveryUserId)}
                            />
                          </td>
                          <td className="max-w-[120px] p-3 font-medium sm:max-w-[160px] md:max-w-[220px] 2xl:max-w-[280px]">
                            <span
                              title={row.userName ?? undefined}
                              className="block max-w-[120px] truncate sm:max-w-[160px] md:max-w-[220px] 2xl:max-w-[280px]"
                            >
                              {row.userName || 'N/A'}
                            </span>
                          </td>
                          <td className="max-w-[160px] truncate p-3 sm:max-w-[200px] md:max-w-[280px] 2xl:max-w-full">
                            <span title={row.userEmail}>{row.userEmail}</span>
                          </td>
                          <td className="max-w-[160px] truncate p-3 sm:max-w-[200px] md:max-w-[280px] 2xl:max-w-full">
                            <span title={row.connectedAccount ?? undefined}>
                              {row.connectedAccount ?? 'N/A'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap p-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 ${style.bg}`}
                            >
                              <span className={`h-1 w-1 shrink-0 rounded-full ${style.dot}`} />
                              <span className={`whitespace-nowrap ${style.text}`}>
                                {STATUS_LABELS[row.connectionStatus] ?? row.connectionStatus}
                              </span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap p-3">
                            {formatDateTime(row.connectedSince)}
                          </td>
                          <td className="whitespace-nowrap p-3">{formatDateTime(row.lastSync)}</td>
                          <td className="whitespace-nowrap p-3 text-center">
                            {/* Not wired yet — no connection detail route/API exists on this side. */}
                            <button
                              type="button"
                              aria-label="View connection"
                              className="group flex h-6 w-6 items-center justify-center rounded-full border border-bottomBorder bg-white transition disabled:opacity-50"
                            >
                              <span className="icon-open-eye text-[12px] text-black transition group-hover:text-yellow" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-[50svh] w-full flex-col items-center justify-center gap-3 p-4">
              <p className="max-w-lg p-4 text-center text-black">
                {debouncedSearch ? 'No connections match your search.' : MU.connectionsEmpty}
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
    </section>
  )
}
