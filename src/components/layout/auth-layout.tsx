import { Outlet, useLocation } from 'react-router-dom'

import { AppLogo } from '@/components/brand/app-logo'
import { useI18n } from '@/i18n/useI18n'
import { cn } from '@/lib/utils'

/**
 * Auth shell — mirrors trade-harmonizer's `(auth)/(login)/layout.tsx` split
 * screen: a form column (logo top-left, centered content, "Powered by"
 * footer) beside a hidden-on-mobile marketing panel (bg image + tinted
 * primary overlay + headline).
 *
 * The signup screen's form is much wider than the other auth screens
 * (Figma's 630px registration card vs. the ~400px login card), so it drops
 * the marketing panel and uses the full column width instead of fighting it
 * for space.
 *
 * Sized the same way as `DashboardLayout` (`h-dvh` + `overflow-hidden` on the
 * shell, `min-h-0 flex-1` — not `h-full` — on the row that hosts the
 * `Outlet`): a percentage-height (`h-full`) flex child doesn't reliably
 * shrink to make room for its siblings (the logo/footer rows here), so on a
 * page whose content is taller than the viewport (signup's long form) that
 * combination let `body`/`#root` grow past 100vh and the *browser's own*
 * scrollbar appeared alongside the page's intended internal one — closing
 * the terms modal then left that stray outer scroll position behind,
 * showing as blank space above/below the form. `min-h-0 flex-1` makes this
 * row a true flex participant that's guaranteed to be clipped to the
 * remaining space instead.
 */
export function AuthLayout() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const hideMarketingPanel = pathname.startsWith('/signup')

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col items-stretch justify-between gap-5 md:flex-row">
        <div
          className={cn(
            'relative h-full w-full overflow-hidden',
            hideMarketingPanel ? 'md:w-full' : 'md:w-3/5',
          )}
        >
          <div className="flex h-full flex-col gap-1">
            <div className="flex items-center justify-start p-3 pl-5 sm:p-5 sm:pl-7 md:pl-10">
              <AppLogo size="sm" />
            </div>
            <div className="mt-5 flex min-h-0 w-full flex-1 items-start justify-center overflow-hidden pb-5 md:mt-0 md:items-center">
              <Outlet />
            </div>
            <div className="flex items-center justify-center p-2">
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500">{t('layout.poweredBy')}</p>
                <a
                  className="text-xs font-semibold text-primary"
                  href="https://www.tradeharmonizer.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('layout.brand')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {hideMarketingPanel ? null : (
          <div className="relative hidden w-full items-center justify-center overflow-hidden text-center text-white md:flex md:w-[45%]">
            {/*
             * The primary tint is `bg-primary` + `mix-blend-multiply` over a
             * 10%-opacity photo, exactly as trade-harmonizer does it. Note it
             * can NOT be expressed as a single `bg-primary/95` layer: `primary`
             * resolves to `var(--primary-color, …)` so tenants can re-brand it,
             * and Tailwind silently drops opacity modifiers on var-based
             * colours — `bg-primary/95` compiles to no CSS at all, which leaves
             * the raw photo showing through.
             */}
            <img
              src={`${process.env.PUBLIC_URL}/images/th-bg.png`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-10"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-primary mix-blend-multiply">
              <div className="flex w-4/5 flex-col gap-2 p-1 lg:p-8">
                <h1 className="text-left text-2xl font-semibold text-white sm:text-3xl md:text-4xl lg:text-5xl">
                  {t('layout.marketing.title')}
                </h1>
                <p className="text-left text-xxtiny font-normal text-white sm:text-xs lg:text-sm">
                  {t('layout.marketing.description')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
