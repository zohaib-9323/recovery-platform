import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { setSideBarExpanded } from '@/app/features/ui/sideBarSlice'
import { useAppDispatch, useAppSelector } from '@/app/redux-hooks'
import { useMediaQuery } from '@/app/hooks/useMediaQuery'
import { getHrefLink, getSideBarTitle } from '@/lib/tradeHarmonizerNav'
import { useAuth } from '@/app/hooks/useAuth'

import { ProfileMenuTh } from '@/components/layout/profile-menu-th'

export function AppHeader() {
  const pathName = useLocation().pathname
  const dispatch = useAppDispatch()
  const expanded = useAppSelector((s) => s.sideBar.sideBarExpanded)
  const [notificationPopup, setNotificationPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 900px)')
  const unreadCount = 0
  const isFetching = false

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

  const prefix = getSideBarTitle(pathName)
  const suffix = getHrefLink(pathName)

  return (
    <div className="w-full">
      <nav className="w-full border-b border-bottomBorder bg-white">
        <div className="">
          <div className="flex h-20">
            <div className="flex w-full flex-row items-center justify-between px-3 md:px-5">
              <div className="flex flex-row items-center gap-2 md:gap-5">
                <button
                  type="button"
                  onClick={() => dispatch(setSideBarExpanded(!expanded))}
                  aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <span
                    className={`${
                      expanded || isMobile ? 'icon-humbuger' : 'icon-left-arrow'
                    } text-base text-humburgerIcon`}
                  />
                </button>
                <div className="flex flex-grow items-center justify-start gap-1 font-lexend text-[34px] font-bold leading-[33px] tracking-normal text-[#000000]">
                  <span className={`text-nowrap capitalize ${!prefix && 'hidden'} sm:flex`}>
                    {prefix.toUpperCase()}
                  </span>
                  <span className="capitalize">{suffix.toUpperCase()}</span>
                </div>
              </div>

              <div className="relative ml-2 flex flex-shrink-0 items-center">
                {isFetching ? (
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
                  aria-label="Notifications"
                >
                  <span className="icon-bell text-large text-white" />
                </button>

                {notificationPopup ? (
                  <div
                    ref={popupRef}
                    className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-bottomBorder bg-white p-4 shadow-lg"
                  >
                    <p className="text-sm text-rp-fg">No notifications (UI placeholder).</p>
                    <button
                      type="button"
                      className="mt-2 text-sm font-semibold text-yellow"
                      onClick={() => setNotificationPopup(false)}
                    >
                      Close
                    </button>
                  </div>
                ) : null}
                <div className="relative ml-2 h-10 min-w-10 smallScreen:ml-5">
                  <ProfileMenuTh
                    name={user?.displayName ?? 'User'}
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
