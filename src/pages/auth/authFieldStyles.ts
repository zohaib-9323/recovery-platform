/**
 * Shared field styling for the auth pages (login, forgot/reset password,
 * first-login OTP + setup) so their `InputField`s match trade-harmonizer's
 * `InputField` — square-ish grey-filled boxes with a small semibold label —
 * instead of the app's default rounded/bordered shell used elsewhere.
 */
export const AUTH_FIELD_SHELL_CLASS = 'rounded-[5px] border border-inputBorder bg-grey px-4'
export const AUTH_INPUT_CLASS =
  'text-xsmall font-normal text-black placeholder:text-greyOne placeholder:font-normal'
export const AUTH_LABEL_CLASS = 'text-xxsmall font-semibold text-lightBlackOne sm:text-sm'
export const AUTH_HEADING_CLASS = 'text-lg font-bold text-black sm:text-xl lg:text-2xl'
export const AUTH_DESCRIPTION_CLASS =
  'text-xs font-normal text-lightBlackOne sm:text-sm lg:text-base'
