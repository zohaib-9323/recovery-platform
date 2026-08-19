import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useGetM365ImportJobsQuery, useGetM365StatusQuery } from '@/app/services/recoveryM365Api'
import { useImportRealtimeRefresh } from '@/app/hooks/useImportRealtimeRefresh'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'

import { ImportActionCard, Microsoft365Icon, NoImportsIcon } from './import-action-card'
import { ImportJobCard } from './import-job-card'
import { StartImportModal } from './start-import-modal'

export function ImportsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: m365Status, isFetching: isStatusFetching } = useGetM365StatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const isConnected = m365Status?.content?.connected ?? false
  const [isStartImportOpen, setIsStartImportOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // No polling: the list only refetches when a push notification about a job status
  // change arrives (see useImportRealtimeRefresh) — either via Firebase's foreground
  // onMessage (useFCM) or the service worker relaying a background push.
  const {
    data: jobsData,
    isFetching: isJobsFetching,
    refetch: refetchJobs,
  } = useGetM365ImportJobsQuery(
    { page: currentPage, limit: pageSize },
    { skip: !isConnected, refetchOnMountOrArgChange: true },
  )
  const jobs = jobsData?.content?.items ?? []
  const totalJobs = jobsData?.content?.total ?? 0
  const totalPages = Math.max(1, jobsData?.content?.totalPages ?? 1)
  const safePage = Math.min(currentPage, totalPages)

  useImportRealtimeRefresh(refetchJobs, isConnected)

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
              onStartAnother={() => setIsStartImportOpen(true)}
              onRetry={() => setIsStartImportOpen(true)}
            />
          ))}

          {totalPages > 1 ? (
            <CustomPagination
              totalPages={totalPages}
              currentPage={safePage}
              onPageChange={setCurrentPage}
            />
          ) : null}
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
