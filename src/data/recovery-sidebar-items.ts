import { RECOVERY_COMPANY_OWNER, type RecoveryUserRole } from '@/types/roles'

export type RecoverySidebarItem = {
  key: string
  label: string
  /** Icon-font class name (icomoon), used when iconSrc is not set. */
  icon?: string
  /** Image asset path, takes precedence over icon when set. */
  iconSrc?: string
  link: string
  /** Omit to show to every authenticated user; set to restrict by role. */
  visibleFor?: RecoveryUserRole[]
}

/** Flat nav — matches Recovery dashboard reference (Dashboard, All Shipments, Inbox, Imports). */
export const recoverySidebarItems: RecoverySidebarItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'icon-home', link: '/dashboard' },
  { key: 'shipments', label: 'All Shipments', icon: 'icon-box', link: '/shipments' },
  { key: 'inbox', label: 'Inbox', icon: 'icon-mail', link: '/inbox' },
  {
    key: 'users',
    label: 'Manage Users',
    icon: 'icon-user',
    link: '/users',
    visibleFor: [RECOVERY_COMPANY_OWNER],
  },
  { key: 'imports', label: 'Imports', iconSrc: '/images/importIcon.svg', link: '/imports' },
  { key: 'settings', label: 'Settings', icon: 'icon-settings', link: '/settings' },
]
