import { useListCompanyM365StatusQuery } from '@/app/services/recoveryCompanyUsersApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { MU } from '@/lib/manage-users-copy'
import type { CompanyConnectionStatusValue } from '@/types/recovery-company-users-api'

/**
 * Microsoft connection status for the owner's team.
 *
 * Mirrors the admin Connections screen — same columns, same status pills, same
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
const HEADINGS = [
  'User',
  'User Email',
  'Connected Account',
  'Connection Status',
  'Connected Since',
  'Last Sync',
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
  connected: { bg: 'bg-green-500/10', dot: 'bg-green-500', text: 'text-green-600' },
  auth_expired: { bg: 'bg-red-500/10', dot: 'bg-red-500', text: 'text-red-600' },
  needs_reconnect: { bg: 'bg-[#E3A602]/10', dot: 'bg-[#E3A602]', text: 'text-[#B37F02]' },
  not_connected: { bg: 'bg-grey', dot: 'bg-greyOne', text: 'text-lightBlackOne' },
}

/** Blank rather than a misleading epoch date when the field is absent. */
const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : 'N/A'

export function CompanyConnectionsCard() {
  const { data, isLoading, isError, refetch } = useListCompanyM365StatusQuery()
  const rows = data?.content?.items ?? []

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <CustomLoader />
      </div>
    )
  }

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-black">{MU.connectionsTitle}</h2>
        <p className="text-xs text-lightBlackOne sm:text-sm">{MU.connectionsDescription}</p>
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
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-bottomBorder p-4">
          <p className="text-sm font-light text-lightBlackOne">{MU.connectionsEmpty}</p>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-lg border border-bottomBorder">
          <div className="max-h-[70svh] w-full overflow-x-auto overflow-y-auto 2xl:max-h-[80svh]">
            <table className="w-full min-w-[880px] bg-white text-left">
              <thead className="sticky top-0 z-10 bg-grey text-black">
                <tr className="text-left text-sm font-medium">
                  {HEADINGS.map((title) => (
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
                {rows.map((row) => {
                  const style = STATUS_STYLES[row.connectionStatus] ?? STATUS_STYLES.not_connected
                  return (
                    <tr
                      key={row.recoveryUserId}
                      className="border-b border-bottomBorder text-xs text-black transition last:border-b-0 hover:bg-grey/50 sm:text-sm"
                    >
                      <td className="max-w-[180px] truncate p-3 font-medium">
                        <span title={row.userName}>{row.userName || 'N/A'}</span>
                      </td>
                      <td className="max-w-[220px] truncate p-3">
                        <span title={row.userEmail}>{row.userEmail}</span>
                      </td>
                      <td className="max-w-[220px] truncate p-3">
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
