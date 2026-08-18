import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useGetM365StatusQuery } from '@/app/services/recoveryApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { useI18n } from '@/i18n/useI18n'

import { ImportActionCard, Microsoft365Icon, NoImportsIcon } from './import-action-card'
import { StartImportModal } from './start-import-modal'

export function ImportsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: m365Status, isLoading: isStatusLoading } = useGetM365StatusQuery()
  const isConnected = m365Status?.content?.connected ?? false
  const [isStartImportOpen, setIsStartImportOpen] = useState(false)

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

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="sticky top-0 bg-white p-3 pb-3 sm:p-6">
        <div className="text-base font-semibold text-black md:text-lg">
          {t('imports.pageTitle')}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
        {isStatusLoading ? (
          <CustomLoader />
        ) : isConnected ? (
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
      <StartImportModal open={isStartImportModalOpen} onClose={closeStartImportModal} />
    </div>
  )
}
