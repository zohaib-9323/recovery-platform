import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAppSelector } from '@/app/redux-hooks'
import { recoverySidebarItems } from '@/data/recovery-sidebar-items'

const BRAND = 'Trade Harmonizer'

export function AppSidebar() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const expanded = useAppSelector((s) => s.sideBar.sideBarExpanded)

  const isActive = useCallback((link: string) => pathname === link, [pathname])

  const go = (link: string) => {
    navigate(link)
  }

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        expanded ? 'w-64' : 'hidden w-20 sm:flex'
      } flex h-full flex-col border-r border-bottomBorder bg-bgColor`}
    >
      <nav>
        <button
          type="button"
          onClick={() => go('/dashboard')}
          className="flex h-20 w-full cursor-pointer flex-row items-center gap-3 border-b border-bottomBorder bg-bgColor px-4 text-left"
        >
          <div className="flex w-fit flex-shrink-0 items-center">
            <img
              src={`${process.env.PUBLIC_URL}/images/app-logo.svg`}
              alt="Trade Harmonizer"
              width={30}
              height={30}
              className="h-[30px] w-[30px] object-contain"
            />
          </div>
          {expanded && (
            <p className="truncate text-sm font-bold text-yellow lg:text-[1rem]">{BRAND}</p>
          )}
        </button>
      </nav>
      <div className="flex h-full flex-col p-5">
        <div className="flex flex-col gap-5">
          {recoverySidebarItems.map((item) => {
            const menuActive = isActive(item.link)
            return (
              <div key={item.key} className="group relative">
                <button
                  type="button"
                  onClick={() => go(item.link)}
                  className={`flex w-full cursor-pointer items-center justify-between truncate rounded p-2.5 text-left transition-all ${
                    menuActive
                      ? 'bg-yellow text-white'
                      : 'text-rp-fg hover:bg-[var(--hover-color)] hover:text-yellow'
                  }`}
                >
                  <div className="absolute bottom-0 right-0 top-0 -mr-6 w-6 group-hover:bg-transparent" />
                  <div className="flex flex-1 items-center gap-2">
                    <span className={`${item.icon} text-large`} aria-hidden />
                    {expanded && <span className="truncate text-sm font-bold">{item.label}</span>}
                  </div>
                </button>

                {!expanded && (
                  <div
                    role="presentation"
                    onClick={() => go(item.link)}
                    className={`pointer-events-none absolute left-[58px] top-1/2 z-10 w-52 origin-left -translate-y-1/2 cursor-pointer whitespace-nowrap rounded-br-lg rounded-tr-lg bg-[var(--hover-color)] p-2 text-sm opacity-0 shadow-[0px_8px_8px_0px_#00000024] transition-opacity duration-200 hover:text-yellow group-hover:pointer-events-auto group-hover:opacity-100 ${
                      menuActive ? 'font-bold text-yellow' : 'text-rp-fg'
                    }`}
                  >
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
