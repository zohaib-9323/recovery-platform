import { Inbox, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useGetRecoveryDashboardQuery,
  useGetRecoveryPreferencesQuery,
  useGetRecoveryShipmentsListQuery,
} from '@/app/services/recoveryApi'
import { ActionCard } from '@/components/dashboard/action-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { CustomLoader } from '@/components/feedback/custom-loader'
import type { KpiStat } from '@/data/mock/dashboard'
import { useI18n } from '@/i18n/useI18n'
import { mapRecoveryStatusToLegacy } from '@/lib/recovery-shipment-status-map'
import type { RecoveryShipmentRecord } from '@/types/recovery-shipments-api'
import type { RecoveryMetricTrend } from '@/types/recovery-user-api'
import {
  AllShipmentsDataTable,
  type ManageShipmentsTableRow,
} from '../shipments/components/all-shipments-data-table'

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

function toNumericRefundStatus(s: RecoveryShipmentRecord): number | undefined {
  const raw = s.refund_status ?? s.refundStatus
  if (raw === undefined || raw === null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function recoveryListShipmentHasC88Document(shipment: RecoveryShipmentRecord): boolean {
  const url = shipment.c88DocumentUrl
  if (url !== null && url !== undefined && String(url).trim() !== '') return true
  const key = shipment.c88S3Key
  if (key !== null && key !== undefined && String(key).trim() !== '') return true
  const name = shipment.c88Filename
  if (name !== null && name !== undefined && String(name).trim() !== '') return true
  const items = shipment.c88Items
  if (Array.isArray(items) && items.length > 0) return true
  return false
}

function toManageShipmentsTableRow(shipment: RecoveryShipmentRecord): ManageShipmentsTableRow {
  const status = mapRecoveryStatusToLegacy(shipment.status)
  const refund_status = toNumericRefundStatus(shipment)
  const c88Raw = shipment.c88DocumentUrl
  const trimmed = c88Raw === null || c88Raw === undefined ? '' : String(c88Raw).trim()
  const c88DocumentUrl = trimmed === '' ? '' : trimmed
  const hasC88Document = recoveryListShipmentHasC88Document(shipment)
  const fnRaw = shipment.c88Filename
  const c88Filename =
    fnRaw === null || fnRaw === undefined ? undefined : String(fnRaw).trim() || undefined

  return {
    _id: shipment._id,
    shipmentTitle: shipment.shipmentTitle || shipment.shipmentReference || 'Untitled Shipment',
    dateRaw: shipment.date,
    createdAtRaw: shipment.createdAt,
    shipVia: shipment.shipVia || '',
    purchaseOrderNumber: shipment.purchaseOrderNumber || '',
    status,
    refund_status,
    c88DocumentUrl,
    hasC88Document,
    c88Filename,
    screeningStatus: shipment.screeningStatus,
    sanctionsScreeningStatus: shipment.sanctionsScreeningStatus,
    sanctionDecision: shipment.sanctionDecision,
    is_flagged: shipment.is_flagged,
    is_challenged: shipment.is_challenged,
    refunded_amount: shipment.refund?.refunded_amount,
  }
}

export function DashboardHomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  // Always hit the API when the dashboard is (re)opened instead of showing the
  // cached stats from a previous visit.
  const { data: dashboardData, isFetching: isDashboardFetching } = useGetRecoveryDashboardQuery(
    undefined,
    { refetchOnMountOrArgChange: true },
  )
  const { data: prefs } = useGetRecoveryPreferencesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: shipmentsData } = useGetRecoveryShipmentsListQuery(
    {
      page: 1,
      limit: 5,
      pageSize: 5,
    },
    { refetchOnMountOrArgChange: true },
  )
  // Tracks whether this visit's dashboard fetch has been dispatched yet — see the loader below.
  const [hasStartedDashboardFetch, setHasStartedDashboardFetch] = useState(false)
  if (isDashboardFetching && !hasStartedDashboardFetch) {
    setHasStartedDashboardFetch(true)
  }

  const dashboardStats = dashboardData?.content?.data
  const timeZone = prefs?.content?.timezone ?? null
  const emailsTrend = dashboardStats?.emailsReceivedTrend
  const createdTrend = dashboardStats?.shipmentsCreatedTrend
  const activeTrend = dashboardStats?.activeShipmentsTrend
  const filesTrend = dashboardStats?.filesProcessedTrend
  const latestShipmentRows = useMemo(
    () =>
      (shipmentsData?.content?.data ?? shipmentsData?.content?.shipments ?? []).map((shipment) =>
        toManageShipmentsTableRow(shipment),
      ),
    [shipmentsData?.content?.data, shipmentsData?.content?.shipments],
  )

  // Show the loader on every visit, not only the first. On a revisit RTK Query serves the
  // cached stats on the first render (isFetching is still false until the mount refetch is
  // dispatched in an effect), so waiting on isFetching alone would flash stale content.
  if (!hasStartedDashboardFetch || isDashboardFetching) {
    return <CustomLoader />
  }

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
    <div className="flex min-h-0 flex-1 flex-col gap-8 p-4 md:p-6">
      <section>
        <h2 className="mb-4 text-base font-semibold text-rp-fg">{t('dashboard.home.overview')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewKpis.map(({ id, ...k }) => (
            <StatCard key={id} {...k} />
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-rp-fg">
            {t('dashboard.home.latestShipments')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/shipments')}
            className="text-sm font-semibold text-rp-accent underline underline-offset-2 hover:opacity-80"
          >
            {t('dashboard.home.viewAll')}
          </button>
        </div>
        <AllShipmentsDataTable
          data={latestShipmentRows}
          selectedUserIds={[]}
          onCheckChange={() => {}}
          showCheckboxColumn={false}
          onSanctionWarning={() => {}}
          timeZone={timeZone}
          showDateSplit={true}
        />
      </section>
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
