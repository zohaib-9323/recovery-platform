import { useMemo, useState } from 'react'

import {
  useGetRecoveryPreferencesQuery,
  usePostRecoveryPreferencesMutation,
} from '@/app/services/recoveryApi'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { listTimezones } from '@/lib/timezones'
import type { RecoveryPreferences } from '@/types/recovery-user-api'

import { CURRENCY_OPTIONS } from './settings-constants'

const tzOptions = listTimezones()

type PreferencesFormProps = {
  baseline: RecoveryPreferences
  instanceKey: number
}

function PreferencesForm({ baseline, instanceKey }: PreferencesFormProps) {
  const { t } = useI18n()
  const [postPreferences, { isLoading: saving }] = usePostRecoveryPreferencesMutation()

  const [currency, setCurrency] = useState(baseline.currency ?? '')
  const [timezone, setTimezone] = useState(baseline.timezone ?? '')
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const dirty = useMemo(
    () => currency !== (baseline.currency ?? '') || timezone !== (baseline.timezone ?? ''),
    [baseline.currency, baseline.timezone, currency, timezone],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)
    if (!currency.trim() || !timezone.trim()) {
      setBanner({ type: 'err', text: t('settings.preferences.requireBoth') })
      return
    }
    try {
      const res = await postPreferences({
        currency: currency.trim(),
        timezone: timezone.trim(),
      }).unwrap()
      if (res.status === false) {
        setBanner({ type: 'err', text: res.message ?? t('settings.preferences.saveFailed') })
        return
      }
      setBanner({ type: 'ok', text: res.message ?? t('settings.preferences.saved') })
    } catch (err) {
      setBanner({ type: 'err', text: getRtkErrorMessage(err) })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <h2 className="text-lg font-semibold text-rp-fg">{t('settings.preferences.title')}</h2>
      {banner ? (
        <p
          role={banner.type === 'err' ? 'alert' : 'status'}
          className={banner.type === 'err' ? 'text-sm text-red-600' : 'text-sm text-rp-success'}
        >
          {banner.text}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`rp-currency-${instanceKey}`}>{t('settings.preferences.currency')}</Label>
          <select
            id={`rp-currency-${instanceKey}`}
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value)
              setBanner(null)
            }}
            className="h-11 w-full rounded-[10px] border border-rp-border bg-rp-input px-3 text-sm text-rp-fg focus:outline-none focus:ring-2 focus:ring-rp-accent"
          >
            <option value="">{t('settings.preferences.currencyPlaceholder')}</option>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`rp-tz-${instanceKey}`}>{t('settings.preferences.timezone')}</Label>
          <select
            id={`rp-tz-${instanceKey}`}
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value)
              setBanner(null)
            }}
            className="h-11 w-full max-w-full rounded-[10px] border border-rp-border bg-rp-input px-3 text-sm text-rp-fg focus:outline-none focus:ring-2 focus:ring-rp-accent"
          >
            <option value="">{t('settings.preferences.timezonePlaceholder')}</option>
            {tzOptions.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !dirty}>
          {saving ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>
    </form>
  )
}

export function PreferencesTab() {
  const { t } = useI18n()
  const { data, isLoading, isFetching, error, fulfilledTimeStamp } =
    useGetRecoveryPreferencesQuery()
  const baseline = data?.content ?? {}
  const instanceKey = fulfilledTimeStamp ?? 0
  const loading = (isLoading || isFetching) && data === undefined

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {t('settings.preferences.loadError')}
      </p>
    )
  }

  if (loading) {
    return <p className="text-sm text-rp-muted">{t('settings.preferences.loading')}</p>
  }

  return <PreferencesForm key={instanceKey} baseline={baseline} instanceKey={instanceKey} />
}
