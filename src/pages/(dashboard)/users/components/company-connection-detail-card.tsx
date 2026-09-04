import { useState } from 'react'

import { useGetCompanyConnectionDetailQuery } from '@/app/services/recoveryCompanyUsersApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { MU } from '@/lib/manage-users-copy'
import { formatFolders } from '@/pages/(dashboard)/imports/format-utils'
import { StatusBadge } from '@/pages/(dashboard)/imports/import-job-status'
import type { CompanyConnectionStatusValue } from '@/types/recovery-company-users-api'
import type { M365ImportJobSummary } from '@/types/recovery-m365-api'

/**
 * One teammate's Microsoft connection, plus the import jobs run against it.
 *
 * The owner twin of the admin connection detail screen — same fields, same
 * status derivation, because the backend serves both from one builder. What
 * differs is scope: this endpoint only ever resolves users inside the caller's
 * own company, and a userId from outside it comes back 404.
 *
 * It shows job COUNTS (scanned, matched, added, failed), never the emails or
 * attachments themselves — those still require the user's own session.
 */

const PAGE_SIZE = 6

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

/** Statuses where the owner has something to chase, rather than just observe. */
const NEEDS_ACTION: CompanyConnectionStatusValue[] = ['auth_expired', 'needs_reconnect']

const JOB_HEADINGS = [
  'Date Range Covered',
  'Folders',
  'Status',
  'Scanned',
  'Matched',
  'Unmatched',
  'Added',
  'Skipped',
  'Failed',
  'Started',
  'Finished',
]

/** Blank rather than a misleading epoch date when the field is absent. */
const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : 'N/A'

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : 'N/A'

const formatDateRange = (start: string, end: string) => `${formatDate(start)} – ${formatDate(end)}`

export function CompanyConnectionDetailCard({ userId }: { userId: string }) {
  const [jobPage, setJobPage] = useState(1)

  const { data, isFetching, isError, refetch } = useGetCompanyConnectionDetailQuery(
    { userId, jobPage, jobLimit: PAGE_SIZE },
    // Revisiting this route should show current data, not a stale cache — a
    // connection that lapsed since the last visit is the whole point of the
    // screen.
    { skip: !userId, refetchOnMountOrArgChange: true },
  )

  const detail = data?.content ?? null

  if (isFetching) {
    return (
      <div className="flex h-[70svh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4">
        <CustomLoader />
      </div>
    )
  }

  if (isError) {
    /*
      A failed request must not render as "connection not found" — that reads
      as a true empty state and hides the fault.
    */
    return (
      <div className="flex flex-col items-start gap-2 rounded-lg border border-bottomBorder p-4">
        <p className="text-sm text-red-700">{MU.connectionDetailFailed}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg border border-bottomBorder px-3 py-2 text-sm font-medium text-black"
        >
          {MU.retry}
        </button>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex h-[50svh] w-full flex-col items-center justify-center gap-3 rounded-lg border border-bottomBorder p-4">
        <p className="max-w-lg p-4 text-center text-black">{MU.connectionNotFound}</p>
      </div>
    )
  }

  const style = STATUS_STYLES[detail.connection.connectionStatus] ?? STATUS_STYLES.not_connected
  const jobs = detail.importJobs?.items ?? []
  const totalPages = detail.importJobs?.totalPages ?? 1

  const fields = [
    { label: MU.email, value: detail.email },
    { label: MU.connectedAccount, value: detail.connection.connectedAccount || 'N/A' },
    { label: MU.connectedSince, value: formatDateTime(detail.connection.connectedSince) },
    { label: MU.lastSync, value: formatDateTime(detail.connection.lastSync) },
    { label: MU.tokenExpiry, value: formatDateTime(detail.connection.tokenExpiry) },
    ...(detail.connection.lastError
      ? [{ label: MU.lastError, value: detail.connection.lastError }]
      : []),
  ]

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex w-full flex-col gap-4 rounded-lg border border-bottomBorder p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-backTwo">{MU.connectionDetailTitle}</p>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${style.bg}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
            <span className={style.text}>
              {STATUS_LABELS[detail.connection.connectionStatus] ??
                detail.connection.connectionStatus}
            </span>
          </span>
        </div>

        {/* Each label/value pair is one grid cell, so a wrap can never leave a
            value stranded on the row below its own label. */}
        <div className="grid grid-cols-1 gap-x-16 gap-y-3 text-sm sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-x-4 sm:gap-y-0"
            >
              <p className="text-greyOne sm:whitespace-nowrap">{field.label}</p>
              <p className="min-w-0 truncate font-medium text-black" title={field.value}>
                {field.value}
              </p>
            </div>
          ))}
        </div>

        {NEEDS_ACTION.includes(detail.connection.connectionStatus) && (
          /* The status pill alone says what is wrong but not what to do about
             it — and an owner cannot reconnect someone else's mailbox. */
          <p className="rounded-lg bg-[#E3A602]/10 p-3 text-sm text-black">{MU.reconnectHint}</p>
        )}
      </div>

      <p className="text-lg font-semibold text-backTwo">{MU.importJobsTitle}</p>

      <div className="flex flex-col gap-3 rounded-lg border border-bottomBorder px-2 py-2 sm:px-4 sm:py-3">
        {jobs.length > 0 ? (
          <div className="w-full overflow-hidden rounded-lg border border-bottomBorder">
            <div className="max-h-[50svh] w-full overflow-x-auto overflow-y-auto 2xl:max-h-[60svh]">
              <table className="w-full min-w-[960px] bg-white text-left">
                <thead className="sticky top-0 z-10 bg-greyFour text-black">
                  <tr className="text-left text-sm font-medium">
                    {JOB_HEADINGS.map((title) => (
                      <th
                        key={title}
                        className="whitespace-nowrap p-3 text-xs font-normal sm:text-sm"
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: M365ImportJobSummary) => {
                    const folders = formatFolders(job.folders, job.folderName)
                    return (
                      <tr
                        key={job.id}
                        className="border-b border-bottomBorder text-xsmall text-black transition last:border-b-0 hover:bg-[var(--hover-color)]"
                      >
                        <td className="whitespace-nowrap p-3">
                          {formatDateRange(job.dateRangeStart, job.dateRangeEnd)}
                        </td>
                        <td className="max-w-[140px] truncate p-3 sm:max-w-[180px] md:max-w-[260px] 2xl:max-w-full">
                          <span title={folders}>{folders}</span>
                        </td>
                        <td className="whitespace-nowrap p-3">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="whitespace-nowrap p-3">{job.stats?.scanned ?? 0}</td>
                        <td className="whitespace-nowrap p-3">{job.stats?.matched ?? 0}</td>
                        <td className="whitespace-nowrap p-3">{job.stats?.unmatched ?? 0}</td>
                        <td className="whitespace-nowrap p-3">{job.stats?.added ?? 0}</td>
                        <td className="whitespace-nowrap p-3">{job.stats?.skipped ?? 0}</td>
                        <td className="whitespace-nowrap p-3">{job.stats?.failed ?? 0}</td>
                        <td className="whitespace-nowrap p-3">{formatDateTime(job.startedAt)}</td>
                        <td className="whitespace-nowrap p-3">{formatDateTime(job.completedAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-[30svh] w-full flex-col items-center justify-center gap-3 p-4">
            <p className="max-w-lg p-4 text-center text-black">{MU.importJobsEmpty}</p>
          </div>
        )}

        {totalPages > 1 && (
          <CustomPagination
            currentPage={detail.importJobs.page}
            totalPages={totalPages}
            onPageChange={setJobPage}
          />
        )}
      </div>
    </section>
  )
}
