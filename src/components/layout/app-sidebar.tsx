import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { useAppSelector } from '@/app/redux-hooks'
import { AppLogo } from '@/components/brand/app-logo'
import { recoverySidebarItems } from '@/data/recovery-sidebar-items'
import type { RecoverySidebarChild } from '@/data/recovery-sidebar-items'
import { t } from '@/i18n/useI18n'

const BRAND = t('layout.brand')

export function AppSidebar() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const expanded = useAppSelector((s) => s.sideBar.sideBarExpanded)

  const isActive = useCallback(
    (link: string) => pathname === link || pathname.startsWith(`${link}/`),
    [pathname],
  )

  /**
   * Which child of a group is the active one: the LONGEST child link the current
   * path matches.
   *
   * Plain prefix matching does not work here — "Import Jobs" links to `/imports`,
   * which is a prefix of every sibling under it, so it would stay highlighted on
   * `/imports/processable-shipments` as well. Longest-match picks the sibling,
   * while still keeping "Import Jobs" active on a detail route like
   * `/imports/abc123` that no sibling claims.
   */
  const activeChildKey = useCallback(
    (children: RecoverySidebarChild[]): string | null => {
      let best: RecoverySidebarChild | null = null
      for (const child of children) {
        if (pathname !== child.link && !pathname.startsWith(`${child.link}/`)) {
          continue
        }
        if (!best || child.link.length > best.link.length) {
          best = child
        }
      }
      return best?.key ?? null
    },
    [pathname],
  )

  /**
   * Explicit open/closed state per group, for groups the user has clicked.
   * A group with no entry here falls back to "open when its own section is the
   * active route", so landing on a sub-route shows where you are without a click.
   *
   * The fallback has to be a DEFAULT, not a requirement: gating open-ness on the
   * route means clicking the parent from anywhere else in the app toggles a flag
   * that can never take effect, and the menu simply never opens.
   */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const toggleGroup = (key: string, currentlyOpen: boolean) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !currentlyOpen }))

  const go = (link: string) => {
    navigate(link)
  }

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        expanded ? 'w-64' : 'hidden w-20 sm:flex'
      } flex h-screen shrink-0 flex-col overflow-hidden border-r border-bottomBorder bg-bgColor`}
    >
      <nav>
        <button
          type="button"
          onClick={() => go('/dashboard')}
          className="flex h-20 w-full cursor-pointer flex-row items-center gap-3 border-b border-bottomBorder bg-bgColor px-4 text-left"
        >
          <div className="flex w-fit flex-shrink-0 items-center">
            <AppLogo className="h-[30px] w-[30px]" size="sm" />
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
            // Children only render in the expanded sidebar — the collapsed rail
            // has no room, so there the parent keeps its original
            // navigate-on-click behaviour unchanged.
            const children = expanded ? item.children : undefined
            const groupOpen = children ? (openGroups[item.key] ?? menuActive) : false
            const activeChild = children ? activeChildKey(children) : null
            return (
              <div key={item.key} className="group relative">
                <button
                  type="button"
                  onClick={() => (children ? toggleGroup(item.key, groupOpen) : go(item.link))}
                  aria-expanded={children ? groupOpen : undefined}
                  className={`flex w-full cursor-pointer items-center justify-between truncate rounded p-2.5 text-left transition-all ${
                    menuActive
                      ? 'bg-yellow text-white'
                      : 'text-rp-fg hover:bg-[var(--hover-color)] hover:text-yellow'
                  }`}
                >
                  <div className="absolute bottom-0 right-0 top-0 -mr-6 w-6 group-hover:bg-transparent" />
                  <div className="flex flex-1 items-center gap-2">
                    {item.iconSrc ? (
                      <span
                        aria-hidden
                        className="h-5 w-5 flex-shrink-0 bg-current"
                        style={{
                          WebkitMaskImage: `url(${item.iconSrc})`,
                          maskImage: `url(${item.iconSrc})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                        }}
                      />
                    ) : (
                      <span className={`${item.icon} text-large`} aria-hidden />
                    )}
                    {expanded && <span className="truncate text-sm font-bold">{item.label}</span>}
                  </div>
                  {children ? (
                    groupOpen ? (
                      <ChevronUp className="ml-2 size-4 flex-shrink-0" aria-hidden />
                    ) : (
                      <ChevronDown className="ml-2 size-4 flex-shrink-0" aria-hidden />
                    )
                  ) : null}
                </button>

                {children && groupOpen ? (
                  <div className="mt-1 flex flex-col">
                    {children.map((child) => {
                      const childActive = activeChild === child.key
                      return (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => go(child.link)}
                          className={`w-full truncate rounded px-3 py-2.5 text-left text-sm transition-all ${
                            childActive
                              ? 'bg-lightYellowThree font-bold text-yellow'
                              : 'text-rp-fg hover:bg-[var(--hover-color)] hover:text-yellow'
                          }`}
                        >
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

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
