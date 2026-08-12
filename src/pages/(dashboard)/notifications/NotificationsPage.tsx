import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useGetRecoveryNotificationsQuery,
  useMarkAllRecoveryNotificationsAsReadMutation,
  useMarkRecoveryNotificationAsReadMutation,
} from '@/app/services/recoveryNotificationsApi'
import { CustomLoader } from '@/components/feedback/custom-loader'
import { CustomPagination } from '@/components/pagination/custom-pagination'
import { useI18n } from '@/i18n/useI18n'
import { getTimeAgo } from '@/lib/getTimeAgo'
import { resolveRecoveryNotificationPath } from '@/lib/notificationNavigation'
import { showCustomToast } from '@/lib/showCustomToast'
import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'

const PAGE_LIMIT = 10
const STATUS_TABS: Array<{ id: 0 | 1 | 2; labelKey: string }> = [
  { id: 0, labelKey: 'notifications.page.all' },
  { id: 1, labelKey: 'notifications.page.read' },
  { id: 2, labelKey: 'notifications.page.unread' },
]

function parseBoldMessage(message: string) {
  const parts = message.split(/(\[bold\]|\[\/bold\])/g)
  let bold = false

  return parts.map((part, index) => {
    if (part === '[bold]') {
      bold = true
      return null
    }
    if (part === '[/bold]') {
      bold = false
      return null
    }
    return bold ? (
      <strong className="text-black" key={index}>
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  })
}

export function NotificationsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<0 | 1 | 2>(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: listData, isFetching } = useGetRecoveryNotificationsQuery(
    { status, search: debouncedSearch.trim() || undefined, page, limit: PAGE_LIMIT },
    { refetchOnMountOrArgChange: true },
  )
  const notifications = listData?.content?.data ?? []
  const totalPages = Math.max(1, listData?.content?.pagination?.totalPages ?? 1)
  const hasUnreadNotifications = notifications.some((notification) => !notification.isRead)

  const [markAsRead] = useMarkRecoveryNotificationAsReadMutation()
  const [markAllAsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllRecoveryNotificationsAsReadMutation()

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap()
      showCustomToast({
        type: 'success',
        title: 'Success',
        message: t('layout.appHeader.markAllRead'),
      })
    } catch {
      showCustomToast({
        type: 'error',
        title: 'Error',
        message: t('notifications.page.markAllReadError'),
      })
    }
  }

  const handleNotificationClick = (item: RecoveryNotificationRecord) => {
    if (!item.isRead) {
      void markAsRead(item._id)
    }
    const path = resolveRecoveryNotificationPath(item)
    if (path) navigate(path)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  const markAllButtonClass = (visibility: 'md:block' | 'md:hidden') =>
    `${
      hasUnreadNotifications ? 'bg-yellow' : 'bg-disableColor'
    } ${visibility} hidden w-full whitespace-nowrap rounded px-3 py-[10px] text-sm font-light text-white lg:w-auto`

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="sticky top-0 bg-white p-3 pb-3 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-2 space-y-0 sm:flex-row sm:space-x-4 sm:space-y-0 md:items-center">
          <div className="min-w-fit text-base font-semibold text-black md:text-lg">
            {t('layout.appHeader.notifications')}
          </div>
          <div className="flex flex-col gap-2 smallScreen:flex-row mobile:items-center mobile:gap-5">
            <div className="flex w-full flex-col gap-3 md:flex-row lg:flex-row lg:items-center lg:gap-5">
              <div className="relative max-w-sm flex-grow">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t('notifications.page.searchPlaceholder')}
                  className="w-full rounded border border-searchBorder py-2.5 pl-3 pr-8 text-sm font-light text-black placeholder:text-lightGreyThree focus:outline-none md:w-[250px] lg:w-[250px] xl:w-[300px] 2xl:w-[350px]"
                  aria-label={t('notifications.page.searchPlaceholder')}
                />
                <div
                  onClick={() => handleSearchChange('')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSearchChange('')
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-black"
                  aria-label={searchQuery ? 'Clear search' : 'Search icon'}
                >
                  <span
                    className={`${searchQuery ? 'icon-close' : 'icon-Search'} text-sm text-black`}
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={!hasUnreadNotifications || isMarkingAllRead}
                onClick={() => void handleMarkAllAsRead()}
                className={markAllButtonClass('md:block')}
              >
                {t('layout.appHeader.markAllRead')}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex w-full items-center justify-between">
          <div className="flex min-w-fit flex-row items-center justify-center gap-3 rounded-lg bg-whiteTwo px-3 py-2 shadow-[inset_0px_0px_10px_0px_#f2f2f2]">
            {STATUS_TABS.map((tab) => (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setStatus(tab.id)
                  setPage(1)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setStatus(tab.id)
                    setPage(1)
                  }
                }}
                className={`${
                  status === tab.id
                    ? 'flex min-w-12 items-center justify-center rounded-lg bg-white px-3 py-2 shadow-[4px_2px_8px_0px_#f2f2f2]'
                    : ''
                } min-w-fit cursor-pointer`}
              >
                <p
                  className={`${
                    status === tab.id ? 'text-black' : 'text-darkColor'
                  } text-sm font-normal`}
                >
                  {t(tab.labelKey)}
                </p>
              </div>
            ))}
          </div>
          <div>
            <button
              type="button"
              disabled={!hasUnreadNotifications || isMarkingAllRead}
              onClick={() => void handleMarkAllAsRead()}
              className={markAllButtonClass('md:hidden')}
            >
              {t('layout.appHeader.markAllRead')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 pt-0">
        {isFetching ? (
          <div className="flex h-full min-h-[40vh] items-center justify-center">
            <CustomLoader />
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col gap-3">
            {notifications.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => handleNotificationClick(item)}
                className="w-full"
              >
                <div
                  className={`border border-bottomBorder ${
                    item.isRead ? 'bg-white' : 'bg-[#FFFBEA]'
                  } flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 shadow-[4px_2px_8px_0px_#f2f2f2] sm:gap-1 sm:px-3 sm:py-2 md:px-4 md:py-2.5`}
                >
                  <div className="flex w-full flex-row items-start justify-start gap-2 sm:gap-3 md:gap-4">
                    <div className="mt-1.5 h-1 min-w-1 flex-shrink-0 rounded-full bg-black sm:mt-2" />
                    <div className="min-w-0 flex-1">
                      <p className="self-start break-words text-left text-xs font-semibold text-black sm:text-sm md:text-sm">
                        {item.title}
                      </p>
                      <p className="mt-1 self-start break-words text-left text-xs font-light text-black sm:text-sm md:text-sm">
                        {parseBoldMessage(item.description)}
                      </p>
                    </div>
                  </div>
                  <p className="ml-3 text-xs font-light text-darkColor sm:ml-4 sm:text-tiny md:ml-6">
                    {getTimeAgo(item.createdAt)}
                  </p>
                </div>
              </button>
            ))}
            {totalPages > 1 ? (
              <div className="mt-2">
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center">
            {t('layout.appHeader.noNotifications')}
          </div>
        )}
      </div>
    </div>
  )
}
