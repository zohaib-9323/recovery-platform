import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useGetM365ImportJobsQuery, useGetM365StatusQuery } from '@/app/services/recoveryM365Api'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'

import { ImportActionCard, Microsoft365Icon, NoImportsIcon } from './import-action-card'
import { ImportJobCard } from './import-job-card'
import { StartImportModal } from './start-import-modal'

/** Statuses that mean the job is still in progress — poll while any of these are present. */
const ACTIVE_STATUSES = new Set(['queued', 'running', 'retrying'])

/** Poll interval while at least one job is active; 0 = no polling. */
const POLL_MS = 3000

export function ImportsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: m365Status, isFetching: isStatusFetching } = useGetM365StatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const isConnected = m365Status?.content?.connected ?? false
  const [isStartImportOpen, setIsStartImportOpen] = useState(false)

  // Start polling as soon as a job is in an active state; stop automatically
  // when all jobs reach a terminal state (completed / failed / cancelled).
  const [pollingInterval, setPollingInterval] = useState(0)

  const { data: jobsData, isFetching: isJobsFetching } = useGetM365ImportJobsQuery(
    { page: 1, limit: 50 },
    { skip: !isConnected, refetchOnMountOrArgChange: true, pollingInterval },
  )
  const jobs = jobsData?.content?.items ?? []
  const totalJobs = jobsData?.content?.total ?? 0

  // Keep polling in sync with whether any job is still active. Adjusting state during
  // render (guarded so it only fires when the target actually changes) avoids the extra
  // render + cascading updates a useEffect would cause here.
  const hasActiveJobs = jobs.some((j) => ACTIVE_STATUSES.has(j.status))
  const targetPollingInterval = hasActiveJobs ? POLL_MS : 0
  if (jobsData && pollingInterval !== targetPollingInterval) {
    setPollingInterval(targetPollingInterval)
  }

  const isStartImportModalOpen =
    isStartImportOpen || (isConnected && searchParams.get('startImport') === 'true')

  const closeStartImportModal = () => {
    setIsStartImportOpen(false)
    if (searchParams.has('startImport')) {
      const next = new URLSearchParams(searchParams)
      next.delete('startImport')
      setSearchParams(next, { replace: true })
    }
  }

  const isLoading = isStatusFetching || (isConnected && isJobsFetching)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="sticky top-0 bg-white p-3 pb-3 sm:p-4"></div>
      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
          <CustomLoader />
        </div>
      ) : isConnected && totalJobs > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-rp-heading">
              {t('imports.progress.title')}
            </span>
            <span className="inline-flex size-[25px] items-center justify-center rounded-full bg-rp-accent text-xs font-semibold text-white">
              {totalJobs}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[10px] border border-rp-border bg-rp-page p-6">
            <span className="text-base font-bold text-rp-heading">
              {t('imports.progress.startNewImport')}
            </span>
            <Button variant="default" onClick={() => setIsStartImportOpen(true)}>
              {t('imports.progress.importAction')}
            </Button>
          </div>

          {jobs.map((job) => (
            <ImportJobCard
              key={job.id}
              job={job}
              onViewDetail={() => navigate(`/imports/${job.id}`)}
              onViewInInbox={() => navigate('/inbox')}
              onStartAnother={() => setIsStartImportOpen(true)}
              onRetry={() => setIsStartImportOpen(true)}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
          {isConnected ? (
            <ImportActionCard
              icon={<NoImportsIcon />}
              title={t('imports.empty')}
              description={t('imports.start.description')}
              actionLabel={t('imports.start.action')}
              onAction={() => setIsStartImportOpen(true)}
            />
          ) : (
            <ImportActionCard
              icon={<Microsoft365Icon />}
              title={t('imports.connect.title')}
              description={t('imports.connect.description')}
              actionLabel={t('imports.connect.action')}
              onAction={() => navigate('/settings?tab=integrations')}
            />
          )}
        </div>
      )}

      <StartImportModal open={isStartImportModalOpen} onClose={closeStartImportModal} />
    </div>
  )
}
