import { useSearchParams } from 'react-router-dom'

import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

import { DeleteAccountTab } from './delete-account-tab'
import { EditProfileTab } from './edit-profile-tab'
import { PreferencesTab } from './preferences-tab'
import { SecurityTab } from './security-tab'
import { SETTINGS_TABS, type SettingsTabId } from './settings-constants'

function parseTab(raw: string | null): SettingsTabId {
  if (raw && SETTINGS_TABS.some((t) => t.id === raw)) {
    return raw as SettingsTabId
  }
  return 'profile'
}

export function SettingsPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const active = parseTab(searchParams.get('tab'))

  const selectTab = (id: SettingsTabId) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'profile') {
      next.delete('tab')
    } else {
      next.set('tab', id)
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-base font-semibold text-rp-fg sm:text-lg">{t('settings.pageTitle')}</h1>

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-[0px_4px_16px_0px_#4C67641A] sm:p-4">
        {SETTINGS_TABS.map(({ id, label, icon }) => {
          const selected = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 rounded px-3 py-2 text-left transition-colors sm:px-5 sm:py-3',
                selected ? 'bg-yellow text-white' : 'text-rp-fg hover:bg-[var(--hover-color)]',
              )}
            >
              <span
                className={cn(
                  icon,
                  selected ? 'text-white' : 'text-rp-fg',
                  'text-sm sm:text-base lg:text-lg',
                )}
                aria-hidden
              />
              <span className="text-sm font-normal sm:text-base lg:text-lg">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-lg bg-white p-4 shadow-[0px_4px_16px_0px_#4C67641A] sm:p-6">
        {active === 'profile' && <EditProfileTab />}
        {active === 'preferences' && <PreferencesTab />}
        {active === 'security' && <SecurityTab />}
        {active === 'delete' && <DeleteAccountTab />}
      </div>
    </div>
  )
}
