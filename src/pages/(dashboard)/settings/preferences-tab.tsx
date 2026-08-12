import { useMemo, useState } from 'react'

import {
  useGetRecoveryPreferencesQuery,
  usePostRecoveryPreferencesMutation,
} from '@/app/services/recoveryApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/useI18n'
import { getRtkErrorMessage } from '@/lib/api-errors'
import { showCustomToast } from '@/lib/showCustomToast'
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

  const baselineCurrency = baseline.currency ?? ''
  const baselineTimezone = baseline.timezone ?? ''
  const [saved, setSaved] = useState({ currency: baselineCurrency, timezone: baselineTimezone })
  const [currency, setCurrency] = useState(baselineCurrency)
  const [timezone, setTimezone] = useState(baselineTimezone)

  const dirty = useMemo(
    () => currency !== saved.currency || timezone !== saved.timezone,
    [currency, saved.currency, saved.timezone, timezone],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currency.trim() || !timezone.trim()) {
      showCustomToast({
        type: 'error',
        title: t('settings.preferences.saveFailed'),
        message: t('settings.preferences.requireBoth'),
      })
      return
    }
    try {
      const normalizedCurrency = currency.trim()
      const normalizedTimezone = timezone.trim()
      const res = await postPreferences({
        currency: normalizedCurrency,
        timezone: normalizedTimezone,
      }).unwrap()
      if (res.status === false) {
        const failureMessage = res.message ?? t('settings.preferences.saveFailed')
        showCustomToast({
          type: 'error',
          title: t('settings.preferences.saveFailed'),
          message: failureMessage,
        })
        return
      }
      setSaved({ currency: normalizedCurrency, timezone: normalizedTimezone })
      setCurrency(normalizedCurrency)
      setTimezone(normalizedTimezone)
      showCustomToast({
        type: 'success',
        title: t('settings.preferences.saved'),
        message: res.message ?? t('settings.preferences.saved'),
      })
    } catch (err) {
      showCustomToast({
        type: 'error',
        title: t('settings.preferences.saveFailed'),
        message: getRtkErrorMessage(err),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <h2 className="text-lg font-semibold text-rp-fg">{t('settings.preferences.title')}</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`rp-currency-${instanceKey}`}>{t('settings.preferences.currency')}</Label>
          <select
            id={`rp-currency-${instanceKey}`}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
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
            onChange={(e) => setTimezone(e.target.value)}
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
    return <CustomLoader />
  }

  return <PreferencesForm key={instanceKey} baseline={baseline} instanceKey={instanceKey} />
}
