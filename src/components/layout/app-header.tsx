import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { setSideBarExpanded } from '@/app/features/ui/sideBarSlice'
import { useAppDispatch, useAppSelector } from '@/app/redux-hooks'
import { useMediaQuery } from '@/app/hooks/useMediaQuery'
import { getHrefLink, getSideBarTitle } from '@/lib/tradeHarmonizerNav'
import { useAuth } from '@/app/hooks/useAuth'
import { useI18n } from '@/i18n/useI18n'
import {
  useGetRecoveryNotificationCountsQuery,
  useGetRecoveryNotificationsQuery,
  useMarkAllRecoveryNotificationsAsReadMutation,
  useMarkRecoveryNotificationAsReadMutation,
} from '@/app/services/recoveryNotificationsApi'
import { resolveRecoveryNotificationPath } from '@/lib/notificationNavigation'
import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'

import { ProfileMenuTh } from '@/components/layout/profile-menu-th'
import { CustomLoader } from '@/components/feedback/custom-loader'

const NOTIFICATION_COUNTS_POLL_MS = 30_000

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
      <strong key={index} className="font-semibold">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  })
}

export function AppHeader() {
  const { t } = useI18n()
  const pathName = useLocation().pathname
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const expanded = useAppSelector((s) => s.sideBar.sideBarExpanded)
  const [notificationPopup, setNotificationPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 900px)')

  const { data: countsData, isFetching: isCountsFetching } = useGetRecoveryNotificationCountsQuery(
    undefined,
    { pollingInterval: NOTIFICATION_COUNTS_POLL_MS },
  )
  const unreadCount = countsData?.content?.unread ?? 0

  const { data: listData, isFetching: isListFetching } = useGetRecoveryNotificationsQuery(
    { limit: 5 },
    { skip: !notificationPopup },
  )
  const notifications = listData?.content?.data ?? []

  const [markAsRead] = useMarkRecoveryNotificationAsReadMutation()
  const [markAllAsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllRecoveryNotificationsAsReadMutation()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#notificationBell')) {
        setNotificationPopup(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [notificationPopup])

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotificationPopup((prev) => !prev)
  }

  const handleNotificationClick = (item: RecoveryNotificationRecord) => {
    if (!item.isRead) {
      void markAsRead(item._id)
    }
    setNotificationPopup(false)
    const path = resolveRecoveryNotificationPath(item)
    if (path) navigate(path)
  }

  const prefix = getSideBarTitle(pathName)
  const suffix = getHrefLink(pathName)

  return (
    <div className="w-full">
      <nav className="w-full border-b border-bottomBorder bg-white">
        <div className="">
          <div className="flex h-20">
            <div className="flex w-full flex-row items-center justify-between px-3 md:px-5">
              <div className="flex min-w-0 flex-row items-center gap-2 md:gap-5">
                <button
                  type="button"
                  onClick={() => dispatch(setSideBarExpanded(!expanded))}
                  aria-label={
                    expanded
                      ? t('layout.appHeader.collapseSidebar')
                      : t('layout.appHeader.expandSidebar')
                  }
                >
                  <span
                    className={`${
                      expanded || isMobile ? 'icon-humbuger' : 'icon-left-arrow'
                    } text-base text-humburgerIcon`}
                  />
                </button>
                <div className="flex min-w-0 flex-grow items-center justify-start gap-1 font-lexend text-sm font-bold leading-tight tracking-normal text-[#000000] sm:text-2xl md:text-[34px] md:leading-[33px]">
                  <span className={`text-nowrap capitalize ${!prefix && 'hidden'} sm:flex`}>
                    {prefix.toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate capitalize">{suffix.toUpperCase()}</span>
                </div>
              </div>

              <div className="relative ml-2 flex flex-shrink-0 items-center">
                {isCountsFetching ? (
                  <div className="absolute -left-1 -top-1 flex h-4 w-4 animate-spin items-center justify-center rounded-full border-4 border-white border-t-yellow bg-white drop-shadow" />
                ) : unreadCount > 0 ? (
                  <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xxtiny drop-shadow">
                    {unreadCount}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={toggleMenu}
                  className="flex items-center justify-center rounded-md bg-yellow p-2"
                  id="notificationBell"
                  aria-label={t('layout.appHeader.notifications')}
                >
                  <span className="icon-bell text-large text-white" />
                </button>

                {notificationPopup ? (
                  <div
                    ref={popupRef}
                    className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-bottomBorder bg-white shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-bottomBorder px-4 py-3">
                      <p className="text-sm font-semibold text-black">
                        {t('layout.appHeader.notifications')}
                      </p>
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          disabled={isMarkingAllRead}
                          className="text-xs font-semibold text-yellow disabled:opacity-50"
                          onClick={() => void markAllAsRead()}
                        >
                          {t('layout.appHeader.markAllRead')}
                        </button>
                      ) : null}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {isListFetching ? (
                        <div className="p-2">
                          <CustomLoader />
                        </div>
                      ) : notifications.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-lightBlackOne">
                          {t('layout.appHeader.noNotifications')}
                        </p>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={`flex w-full flex-col gap-1 border-b border-bottomBorder px-4 py-3 text-left last:border-b-0 hover:bg-greyFour ${
                              item.isRead ? '' : 'bg-[#FEF9E7]'
                            }`}
                          >
                            <span className="text-sm font-medium text-black">{item.title}</span>
                            <span className="text-xs text-lightBlackOne">
                              {parseBoldMessage(item.description)}
                            </span>
                            {item.createdAt ? (
                              <span className="text-xxtiny text-lightBlackOne">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && pathName !== '/notifications' ? (
                      <div className="mb-2 mt-3 flex w-full items-center justify-center gap-2">
                        <div className="w-fit">
                          <button
                            type="button"
                            onClick={() => {
                              setNotificationPopup(false)
                              navigate('/notifications')
                            }}
                            className="w-20 rounded bg-yellow p-2 text-xxtiny font-light text-white"
                          >
                            {t('layout.appHeader.viewAll')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="relative ml-2 h-10 min-w-10 smallScreen:ml-5">
                  <ProfileMenuTh
                    name={user?.displayName ?? t('layout.appHeader.profileFallbackName')}
                    email={user?.email ?? ''}
                    avatarUrl={user?.profilePic}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
