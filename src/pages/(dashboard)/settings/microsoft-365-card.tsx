import { useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
  useGetM365StatusQuery,
  useGetM365AuthUrlMutation,
  useDisconnectM365Mutation,
} from '@/app/services/recoveryApi'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'
import { showCustomToast } from '@/lib/showCustomToast'

/** Microsoft's brand mark is a fixed 4-colour grid — not a themeable design token. */
const MICROSOFT_LOGO_COLORS = ['bg-[#F35325]', 'bg-[#81BC06]', 'bg-[#05A6F0]', 'bg-[#FFBA08]']

function Microsoft365Logo() {
  return (
    <div className="grid size-11 grid-cols-2 grid-rows-2 gap-[3px]" aria-hidden>
      {MICROSOFT_LOGO_COLORS.map((color) => (
        <span key={color} className={cn('size-full', color)} />
      ))}
    </div>
  )
}

export function Microsoft365Card() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: statusData, isLoading: statusLoading, refetch } = useGetM365StatusQuery()
  const [getAuthUrl, { isLoading: authUrlLoading }] = useGetM365AuthUrlMutation()
  const [disconnect, { isLoading: disconnecting }] = useDisconnectM365Mutation()

  const connected = statusData?.content?.connected ?? false
  const email = statusData?.content?.email ?? ''

  // Handle redirect back from Microsoft OAuth
  useEffect(() => {
    const m365Param = searchParams.get('m365')
    if (!m365Param) return

    const next = new URLSearchParams(searchParams)
    next.delete('m365')
    next.delete('reason')
    setSearchParams(next, { replace: true })

    if (m365Param === 'connected') {
      refetch()
      showCustomToast({
        type: 'success',
        title: t('settings.integrations.microsoft365'),
        message: t('settings.integrations.connectedToast'),
      })
    } else if (m365Param === 'error') {
      showCustomToast({
        type: 'error',
        title: t('settings.integrations.microsoft365'),
        message: t('settings.integrations.connectErrorToast'),
      })
    }
  }, [searchParams, setSearchParams, refetch, t])

  const handleConnect = async () => {
    try {
      const result = await getAuthUrl().unwrap()
      const url = result?.content?.url
      if (!url) throw new Error('No auth URL returned')
      window.location.href = url
    } catch {
      showCustomToast({
        type: 'error',
        title: t('settings.integrations.microsoft365'),
        message: t('settings.integrations.connectErrorToast'),
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect().unwrap()
      showCustomToast({
        type: 'info',
        title: t('settings.integrations.microsoft365'),
        message: t('settings.integrations.disconnectedToast'),
      })
    } catch {
      showCustomToast({
        type: 'error',
        title: t('settings.integrations.microsoft365'),
        message: t('settings.integrations.disconnectErrorToast'),
      })
    }
  }

  const handleStartImport = () => {
    navigate('/imports?startImport=true')
  }

  if (statusLoading) {
    return (
      <div className="flex min-h-[326px] w-full max-w-[552px] items-center justify-center rounded-[10px] border-2 border-rp-accent bg-rp-bg p-6">
        <span className="text-sm text-rp-muted">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-[300px] w-full max-w-[552px] flex-col gap-1 rounded-[10px] border-2 border-rp-accent bg-rp-bg p-6">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <Microsoft365Logo />
          {connected && (
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-[5px] bg-rp-success/10 px-2 py-1 text-sm text-rp-success">
                <span className="size-1 rounded-full bg-rp-success" aria-hidden />
                {t('settings.integrations.active')}
              </span>
              <p className="text-xs font-medium text-rp-muted">
                {t('settings.integrations.connectedAs', { email })}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold text-rp-fg">{t('settings.integrations.microsoft365')}</p>
          <p className="text-sm leading-6 text-rp-muted">
            {connected
              ? t('settings.integrations.connectedDesc')
              : t('settings.integrations.disconnectedDesc')}
          </p>
        </div>

        {!connected && (
          <div className="flex items-center gap-1 rounded-md bg-rp-blueWithOpacity px-3 py-2">
            <Lock className="size-4 shrink-0 text-rp-blue" aria-hidden />
            <p className="text-[12px] text-rp-blue">{t('settings.integrations.privacyNotice')}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {connected ? (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {t('settings.integrations.disconnect')}
            </Button>
            <Button variant="default" className="flex-1" onClick={handleStartImport}>
              {t('settings.integrations.startImport')}
            </Button>
          </>
        ) : (
          <Button
            variant="default"
            className="w-full"
            onClick={handleConnect}
            disabled={authUrlLoading}
          >
            {t('settings.integrations.connect')}
          </Button>
        )}
      </div>
    </div>
  )
}
