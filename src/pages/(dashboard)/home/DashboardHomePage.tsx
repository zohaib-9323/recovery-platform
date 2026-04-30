import { Inbox, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useGetRecoveryDashboardQuery } from '@/app/services/recoveryApi'
import { ActionCard } from '@/components/dashboard/action-card'
import { ShipmentsDataTable } from '@/components/dashboard/shipments-data-table'
import { StatCard } from '@/components/dashboard/stat-card'
import { latestShipments, type KpiStat } from '@/data/mock/dashboard'
import { useI18n } from '@/i18n/useI18n'
import type { RecoveryMetricTrend } from '@/types/recovery-user-api'

function formatMetric(value: number | undefined): string {
  if (typeof value !== 'number') return '--'
  return value.toLocaleString('en-GB')
}

function mapTrendDirection(trend?: RecoveryMetricTrend): KpiStat['trend'] {
  if (!trend) return 'none'
  if (trend.trend === 'up' || trend.trend === 'down' || trend.trend === 'none') return trend.trend
  return trend.increased ? 'up' : 'down'
}

function formatTrendHint(trend?: RecoveryMetricTrend): string {
  if (!trend) return '0.00%'
  const numeric = Number(trend.percentage)
  const value = Number.isFinite(numeric) ? numeric.toFixed(2) : trend.percentage
  const sign = trend.increased && !value.startsWith('-') ? '+' : ''
  return `${sign}${value}%`
}

export function DashboardHomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: dashboardData } = useGetRecoveryDashboardQuery()
  const dashboardStats = dashboardData?.content?.data
  const emailsTrend = dashboardStats?.emailsReceivedTrend
  const createdTrend = dashboardStats?.shipmentsCreatedTrend
  const activeTrend = dashboardStats?.activeShipmentsTrend
  const filesTrend = dashboardStats?.filesProcessedTrend

  const overviewKpis: KpiStat[] = [
    {
      id: 'emails',
      label: 'Emails Received',
      value: formatMetric(dashboardStats?.emailsReceived),
      hint:
        mapTrendDirection(emailsTrend) === 'none'
          ? `• ${formatMetric(dashboardStats?.emailsReceivedToday)} new today`
          : formatTrendHint(emailsTrend),
      trend: mapTrendDirection(emailsTrend),
      hintTone: mapTrendDirection(emailsTrend) === 'none' ? 'success' : undefined,
    },
    {
      id: 'created',
      label: 'Shipments Created',
      value: formatMetric(dashboardStats?.shipmentsCreated),
      hint: formatTrendHint(createdTrend),
      trend: mapTrendDirection(createdTrend),
    },
    {
      id: 'active',
      label: 'Active Shipments',
      value: formatMetric(dashboardStats?.activeShipments),
      hint: formatTrendHint(activeTrend),
      trend: mapTrendDirection(activeTrend),
    },
    {
      id: 'files',
      label: 'Files Processed',
      value: formatMetric(dashboardStats?.filesProcessed),
      hint: formatTrendHint(filesTrend),
      trend: mapTrendDirection(filesTrend),
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-base font-semibold text-rp-fg">{t('dashboard.home.overview')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewKpis.map(({ id, ...k }) => (
            <StatCard key={id} {...k} />
          ))}
        </div>
      </section>

      <ShipmentsDataTable title={t('dashboard.home.latestShipments')} rows={latestShipments} />

      <section>
        <h2 className="mb-4 text-base font-semibold text-rp-fg">
          {t('dashboard.home.quickActions')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ActionCard
            title={t('dashboard.home.viewShipments')}
            description={`${formatMetric(dashboardStats?.activeShipments)} active shipments`}
            icon={Package}
            onClick={() => navigate('/shipments')}
          />
          <ActionCard
            title={t('dashboard.home.openInbox')}
            description={`${formatMetric(dashboardStats?.emailsReceivedToday)} emails received today`}
            icon={Inbox}
            onClick={() => navigate('/inbox')}
          />
        </div>
      </section>
    </div>
  )
}
