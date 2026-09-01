/**
 * Field styling for the signup screen (`SignupPage`).
 *
 * Builds on the shared auth constants (`authFieldStyles.ts`) — same grey-filled
 * trade-harmonizer look — then applies the signup Figma's own metrics: 40px
 * controls, 15px horizontal padding, 12px semibold labels and 14px values,
 * matching the Manage Users modals' `user-modal-styles.ts` approach but with
 * the smaller label/value sizes this screen's Figma actually uses.
 */
import { AUTH_FIELD_SHELL_CLASS } from '@/pages/auth/authFieldStyles'

export const SIGNUP_FIELD_SHELL_CLASS = `${AUTH_FIELD_SHELL_CLASS} h-10 gap-[10px] px-[15px]`

export const SIGNUP_INPUT_CLASS =
  'text-[14px] font-normal text-black placeholder:font-normal placeholder:text-greyOne'

export const SIGNUP_LABEL_CLASS = 'text-[12px] font-semibold text-lightBlackOne'

export const SIGNUP_FIELD_CONTAINER_CLASS = 'gap-[10px]'

export const SIGNUP_SECTION_TITLE_CLASS = 'text-xl font-bold text-black sm:text-2xl'

export const SIGNUP_SECTION_DESCRIPTION_CLASS =
  'text-sm font-normal text-lightBlackOne sm:text-base'
