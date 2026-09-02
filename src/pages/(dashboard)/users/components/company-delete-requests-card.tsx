import { useState } from 'react'

import {
  useDecideCompanyDeleteRequestMutation,
  useListCompanyDeleteRequestsQuery,
} from '@/app/services/recoveryCompanyUsersApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { MU } from '@/lib/manage-users-copy'
import { showCustomToast } from '@/lib/showCustomToast'

/**
 * The Company Owner's deletion-request queue.
 *
 * Same table shape as the admin deletion-requests screen — Name, Email,
 * Requested At, Reason, Status, Actions — so the two review surfaces read
 * alike. A Company User's request comes here; the owner's own goes to the
 * platform admin instead, which is why an owner never sees themselves listed.
 *
 * Approving suspends the account immediately, matching the admin decision
 * path, so the confirmation says so rather than implying a reversible step.
 */
const HEADINGS = ['Name', 'Email', 'Requested At', 'Reason', 'Status', 'Actions']

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : 'N/A'

export function CompanyDeleteRequestsCard() {
  const { data, isLoading, isError, refetch } = useListCompanyDeleteRequestsQuery()
  const [decide] = useDecideCompanyDeleteRequestMutation()
  const [busyId, setBusyId] = useState<string | null>(null)

  const requests = data?.content?.data ?? []

  const handle = async (id: string, decision: 'approve' | 'reject') => {
    setBusyId(id)
    try {
      await decide({ id, decision }).unwrap()
      showCustomToast({
        type: 'success',
        title: MU.deleteRequestsTitle,
        message: decision === 'approve' ? MU.deleteRequestApproved : MU.deleteRequestRejected,
      })
    } catch (err) {
      showCustomToast({
        type: 'error',
        title: MU.deleteRequestsTitle,
        message: getRtkErrorMessage(err),
      })
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <CustomLoader />
      </div>
    )
  }

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-black">{MU.deleteRequestsTitle}</h2>
        <p className="text-xs text-lightBlackOne sm:text-sm">{MU.deleteRequestsDescription}</p>
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
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-bottomBorder p-4">
          <p className="text-sm font-light text-lightBlackOne">{MU.deleteRequestsEmpty}</p>
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
                {requests.map((request) => (
                  <tr
                    key={request._id}
                    className="border-b border-bottomBorder text-xs text-black transition last:border-b-0 hover:bg-grey/50 sm:text-sm"
                  >
                    <td className="max-w-[180px] truncate p-3 font-medium">
                      {`${request.firstName} ${request.lastName}`.trim() || 'N/A'}
                    </td>
                    <td className="max-w-[220px] truncate p-3">
                      <span title={request.email}>{request.email}</span>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {formatDateTime(request.deletionRequestedAt)}
                    </td>
                    <td className="max-w-[260px] truncate p-3">
                      <span title={request.deletionRequestReason ?? undefined}>
                        {request.deletionRequestReason || 'N/A'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      <span className="inline-flex items-center gap-1.5 rounded bg-[#E3A602]/10 px-2 py-1">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#E3A602]" />
                        <span className="whitespace-nowrap text-[#B37F02]">Pending</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === request._id}
                          onClick={() => void handle(request._id, 'approve')}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {MU.deleteRequestApprove}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === request._id}
                          onClick={() => void handle(request._id, 'reject')}
                          className="rounded-lg border border-bottomBorder px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                        >
                          {MU.deleteRequestReject}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
