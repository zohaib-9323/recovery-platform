import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/hooks/useAuth'
import {
  connectMicrosoft365,
  disconnectMicrosoft365,
} from '@/app/features/integrations/microsoftIntegrationSlice'
import { useAppDispatch, useAppSelector } from '@/app/redux-hooks'
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const connected = useAppSelector((state) => state.microsoftIntegration.connected)

  const email = user?.email ?? 'user@client.com'

  const handleConnect = () => {
    dispatch(connectMicrosoft365())
    showCustomToast({
      type: 'success',
      title: t('settings.integrations.microsoft365'),
      message: t('settings.integrations.connectedAs', { email }),
    })
  }

  const handleDisconnect = () => {
    dispatch(disconnectMicrosoft365())
    showCustomToast({
      type: 'info',
      title: t('settings.integrations.microsoft365'),
      message: t('settings.integrations.disconnectedToast'),
    })
  }

  const handleStartImport = () => {
    navigate('/imports?startImport=true')
  }

  return (
    <div className="flex min-h-[326px] w-full max-w-[552px] flex-col gap-2 rounded-[10px] border-2 border-rp-accent bg-rp-bg p-6">
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <Microsoft365Logo />
          {connected && (
            <div className="flex flex-col items-end gap-1.5">
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
          <div className="flex items-center gap-1 rounded-md bg-rp-accent/10 px-3 py-2">
            <Lock className="size-4 shrink-0 text-rp-accent-dark" aria-hidden />
            <p className="text-[12px] text-rp-accent-dark">
              {t('settings.integrations.privacyNotice')}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {connected ? (
          <>
            <Button variant="secondary" className="flex-1" onClick={handleDisconnect}>
              {t('settings.integrations.disconnect')}
            </Button>
            <Button variant="default" className="flex-1" onClick={handleStartImport}>
              {t('settings.integrations.startImport')}
            </Button>
          </>
        ) : (
          <Button variant="default" className="w-full" onClick={handleConnect}>
            {t('settings.integrations.connect')}
          </Button>
        )}
      </div>
    </div>
  )
}
