import { Outlet, useLocation } from 'react-router-dom'

import { AppLogo } from '@/components/brand/app-logo'
import { useI18n } from '@/i18n/useI18n'

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
 * The signup route uses a different shell from the other auth screens,
 * copied from trade-harmonizer's `(auth)/(signup)/layout.tsx`: ONE scroller
 * (`flex-grow overflow-y-auto`) holding both the form and the footer, with no
 * vertical centering.
 *
 * The centered shell below is right for the short login/forgot/reset cards but
 * wrong for signup's long form. `items-center` overflows a too-tall child
 * equally above and below its container, and the overflow above the top edge
 * cannot be scrolled to — so the form sat shifted up with its first fields cut
 * off, and anything that moved focus (opening the terms modal) made it obvious.
 * Nesting a second `overflow-y-auto` inside an `overflow-hidden` parent made it
 * worse by splitting the scroll between two elements.
 *
 * THE SIGNUP SHELL MUST PRODUCE EXACTLY ONE SCROLLBAR. Three classes do that
 * and all three are load-bearing:
 *   - `overflow-hidden` on the `h-dvh` shell, so the document itself can never
 *     scroll;
 *   - `min-h-0` on the scrolling child — a flex item defaults to
 *     `min-height: auto`, which refuses to shrink below its content, so without
 *     this the child grows to the full height of the form instead of the space
 *     left over, the shell overflows, and the browser adds a SECOND scrollbar
 *     for the document on top of the intended inner one;
 *   - `shrink-0` on the logo row, so it is never squeezed to make room.
 * Two scrollbars is the bug that made the signup form jump when the terms modal
 * opened: the page and the form scrolled independently.
 *
 * The shell is `fixed inset-0` rather than `h-dvh` for that reason. Global CSS
 * sets `min-height: 100vh` on BOTH `body` and `#root`, so an in-flow
 * full-height shell can push the document past the viewport and earn it a
 * second scrollbar. Taking the shell out of flow means it contributes no height
 * to those elements at all, and the document has nothing to scroll — leaving
 * the inner `overflow-y-auto` as the only scroller that can exist.
 */
export function AuthLayout() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  // Accept-invite runs the same long, stepper-driven form as signup, so it
  // needs signup's single-scroller shell. The split marketing shell below is
  // sized for short forms; a tall child in it is what produced the
  // second-scrollbar bug these tests guard against.
  // `/first-login/verify-otp` only — its sibling `/first-login/setup-password`
  // keeps the split marketing shell, per the design.
  const hideMarketingPanel =
    pathname.startsWith('/signup') ||
    pathname.startsWith('/accept-invite') ||
    pathname.startsWith('/first-login/verify-otp')

  // trade-harmonizer's registration shell, matched structurally: logo row,
  // then a single scrolling region containing the form and the footer.
  if (hideMarketingPanel) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-bgColor">
        <div className="flex shrink-0 flex-row items-center justify-between p-3 pl-5 sm:p-5 sm:pl-7 md:pl-10">
          <AppLogo size="sm" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl">
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
    )
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col items-stretch justify-between gap-5 md:flex-row">
        <div className="relative h-full w-full overflow-hidden md:w-3/5">
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
      </div>
    </div>
  )
}
