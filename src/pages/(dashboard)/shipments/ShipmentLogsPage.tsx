import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  useGetRecoveryPreferencesQuery,
  useGetRecoveryShipmentByIdQuery,
  useGetRecoveryShipmentLogsQuery,
} from '@/app/services/recoveryApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { Tooltip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n/useI18n'
import { MS } from '@/lib/manage-shipments-copy'
import {
  formatLogDisplayDate,
  formatLogValue,
  isLogDateToday,
  shipmentLogHeadingTitles,
  shipmentLogStatusColor,
} from '@/pages/(dashboard)/shipments/components/shipment-logs-helper'

export function ShipmentLogsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { id = '' } = useParams()
  const [currentPage, setCurrentPage] = useState(1)

  const { data: prefs } = useGetRecoveryPreferencesQuery()
  const timeZone = prefs?.content?.timezone ?? null

  const { data: shipmentData } = useGetRecoveryShipmentByIdQuery(id, { skip: !id })
  const { data, isLoading, isFetching } = useGetRecoveryShipmentLogsQuery(
    {
      id,
      page: currentPage,
      limit: 10,
    },
    { skip: !id },
  )

  const shipmentTitle =
    shipmentData?.content?.shipmentTitle ||
    shipmentData?.content?.shipmentReference ||
    shipmentData?.content?.sourceShipmentId ||
    data?.content?.ShipmentName ||
    'Shipment'

  // A group's heading normally shows just that day's date. Since a day with no new
  // events simply gets no group at all, the most recent group's heading also carries
  // the range through today (e.g. "09/08/2026 - 11/08/2026") so it's clear nothing
  // has changed since — today's own group (if one exists) just shows today's date.
  const todayLabel = formatLogDisplayDate(new Date().toISOString(), timeZone)

  const logs = data?.content?.logs ?? []
  const totalPages = data?.content?.pagination?.totalPages ?? 1
  const isPageLoading = isLoading || isFetching

  if (!id) {
    return (
      <div className="rounded-lg bg-white p-6 text-sm text-black">
        {t('shipments.detail.notFound')}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-white p-3 sm:p-6">
      <header className="flex shrink-0 items-start gap-2 sm:items-center">
        <button
          type="button"
          onClick={() => navigate(`/shipments/${id}`)}
          className="flex h-8 w-8 items-center justify-center rounded border border-bottomBorder"
          aria-label={t('shipments.logs.backToDetail')}
        >
          <span className="icon-arrow-left text-xl text-black" />
        </button>

        <div className="flex flex-row items-center gap-1">
          <Tooltip content={shipmentTitle}>
            <h1 className="max-w-28 truncate pr-1 text-base font-semibold capitalize text-backTwo xSmallScreen:max-w-56 md:max-w-xl lg:max-w-2xl lg:text-lg xl:max-w-full">
              {shipmentTitle}
              <strong className="px-1 text-base font-normal text-greyOne sm:text-lg">
                {MS.logs}
              </strong>
            </h1>
          </Tooltip>
        </div>
      </header>

      <main className="no-scrollbar flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto">
        <div className="flex items-center border border-bottomBorder bg-greyFour p-4">
          {shipmentLogHeadingTitles.map((item) => (
            <div key={item} className="w-1/3">
              <p className="text-xs font-medium capitalize text-black sm:text-sm">{item}</p>
            </div>
          ))}
        </div>

        {isPageLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <CustomLoader />
          </div>
        ) : logs.length > 0 ? (
          <>
            {logs.map((item, index) => {
              const isToday = isLogDateToday(item.date, timeZone)
              // Only the most recent group (index 0) carries the range through
              // today — older groups just show their own day, unchanged.
              const showsRangeToToday = index === 0 && !isToday

              return (
                <div key={`${item.date}-${index}`} className="flex flex-col gap-2">
                  <div className="flex flex-row items-center gap-3">
                    <p className="ml-2 text-xs font-medium text-black sm:text-sm">
                      {formatLogDisplayDate(item.date, timeZone)}
                      {showsRangeToToday ? ` - ${todayLabel}` : ''}
                    </p>
                    {isToday ? (
                      <>
                        <div className="h-1 min-w-1 rounded-full bg-lightGreyFour" />
                        <p className="text-xs font-medium text-black sm:text-sm">{MS.today}</p>
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-4">
                    {item.events.map((event) => {
                      const descriptionText = formatLogValue(event.description)
                      const hasLongWord = descriptionText
                        .split(/\s+/)
                        .some((word) => word.length > 15)

                      return (
                        <div key={event._id} className="flex flex-row items-start">
                          <div className="flex h-full w-1/3 items-center justify-center">
                            <div className="flex h-full flex-col items-center gap-1">
                              <p className="text-xs font-normal text-darkColor sm:text-sm">
                                {event.time}
                              </p>
                              <div className="flex h-full flex-col items-center justify-center">
                                <div
                                  className={`min-h-3 min-w-3 ${shipmentLogStatusColor(event.color)} rounded-full`}
                                />
                                <div className="h-10 w-0 border border-searchBorder" />
                              </div>
                            </div>
                          </div>

                          <div className="mb-2 flex w-2/3 items-start rounded border border-bottomBorder px-4 py-3">
                            <div className="w-1/2">
                              <p className="text-xs font-medium capitalize text-backTwo sm:text-sm">
                                {event.title}
                              </p>
                            </div>
                            <div className="flex w-1/2 flex-col gap-1">
                              <p
                                className={`break-words text-xs font-normal text-backTwo first-letter:uppercase sm:text-sm ${hasLongWord ? 'break-words' : ''}`}
                              >
                                {descriptionText}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {totalPages > 1 ? (
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="flex w-full max-w-lg flex-col items-center justify-center gap-5">
              <img src="/images/emptybox.svg" alt="" width={200} height={200} />
              <p className="text-center text-lg font-light text-black">{MS.noShipmentLogs}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
