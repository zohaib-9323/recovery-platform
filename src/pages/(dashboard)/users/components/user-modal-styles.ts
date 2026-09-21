/**
 * Field styling for the Create User / Invite User modals.
 *
 * Builds on the auth pages' shared constants (`authFieldStyles.ts`) so the
 * modals use the same grey-filled trade-harmonizer field look, then applies the
 * Figma modal's own metrics: 40px controls, 15px horizontal padding and a 16px
 * value/placeholder instead of the auth pages' 14px.
 *
 * Font sizes are written as arbitrary lengths (`text-[16px]`) rather than the
 * `text-normal` alias for the reason documented in `authFieldStyles.ts`:
 * tailwind-merge buckets custom aliases as text *colours* and silently drops
 * them when a later `text-black` lands in the same `cn()` chain.
 */
import { AUTH_FIELD_SHELL_CLASS } from '@/pages/auth/authFieldStyles'

/** 40px tall, 15px inner padding — Figma "Frame 105". */
export const USER_MODAL_FIELD_SHELL_CLASS = `${AUTH_FIELD_SHELL_CLASS} h-10 gap-[10px] px-[15px]`

export const USER_MODAL_INPUT_CLASS =
  'text-[16px] font-normal text-black placeholder:font-normal placeholder:text-greyOne'

/** 14px semibold label sitting 10px above its control. */
export const USER_MODAL_LABEL_CLASS = 'text-[14px] font-semibold text-lightBlackOne'

export const USER_MODAL_FIELD_CONTAINER_CLASS = 'gap-[10px]'

/** 24px bold section title + 16px description, 10px apart. */
export const USER_MODAL_TITLE_CLASS = 'text-2xl font-bold text-black'
export const USER_MODAL_DESCRIPTION_CLASS = 'text-[16px] font-normal text-lightBlackOne'

/** Footer buttons: 40px tall, 5px radius, 14px label. */
export const USER_MODAL_CANCEL_BUTTON_CLASS =
  'flex h-10 items-center justify-center rounded-[5px] border border-bottomBorder bg-white px-4 text-sm font-normal text-black transition hover:bg-greyFour'
export const USER_MODAL_SUBMIT_BUTTON_CLASS =
  'flex h-10 min-w-[140px] items-center justify-center rounded-[5px] bg-yellow px-4 text-sm font-normal text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-disableColor disabled:text-white'
