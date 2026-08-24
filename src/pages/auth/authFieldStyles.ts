/**
 * Shared field styling for the auth pages (login, forgot/reset password,
 * first-login OTP + setup) so their `InputField`s match trade-harmonizer's
 * `InputField` — square-ish grey-filled boxes with a small semibold label —
 * instead of the app's default rounded/bordered shell used elsewhere.
 *
 * Values mirror trade-harmonizer `src/app/_components/input-field/index.tsx`
 * and `(auth)/(login)/login/page.tsx`: `bg-grey` fill, `border-inputBorder` at
 * rest, `focus:border-yellow` (a border swap, *not* the app's default focus
 * ring), `rounded-[5px]`, `px-4`. The error state is owned by
 * `fieldControlInvalidClass`, applied after these classes so a red border
 * always wins the tailwind-merge conflict.
 *
 * Font sizes that trade-harmonizer writes as `text-xsmall` / `text-xxsmall`
 * are written here as arbitrary lengths instead. These strings go through
 * `cn()` (tailwind-merge), which only treats t-shirt sizes and arbitrary
 * lengths as font sizes — a custom alias like `text-xsmall` is bucketed as a
 * *text colour* and gets silently dropped by a later `text-black` in the same
 * chain. The px values are identical to the aliases they replace.
 */
export const AUTH_FIELD_SHELL_CLASS =
  'rounded-[5px] border border-inputBorder bg-grey px-4 focus-within:border-yellow focus-within:ring-0 focus-within:ring-offset-0'
export const AUTH_INPUT_CLASS =
  'text-[14px] font-normal text-black placeholder:font-normal placeholder:text-greyOne'
export const AUTH_LABEL_CLASS = 'text-[13px] font-semibold text-lightBlackOne sm:text-[14px]'
export const AUTH_HEADING_CLASS = 'text-lg font-bold text-black sm:text-xl lg:text-2xl'
export const AUTH_DESCRIPTION_CLASS =
  'text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base'
