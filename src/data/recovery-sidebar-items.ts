import { RECOVERY_COMPANY_OWNER, type RecoveryUserRole } from '@/types/roles'

export type RecoverySidebarChild = {
  key: string
  label: string
  link: string
}

export type RecoverySidebarItem = {
  key: string
  label: string
  /** Icon-font class name (icomoon), used when iconSrc is not set. */
  icon?: string
  /** Image asset path, takes precedence over icon when set. */
  iconSrc?: string
  link: string
  /**
   * Sub-routes rendered as an expandable group under this item. When present,
   * clicking the parent toggles the group open/closed instead of navigating —
   * `link` is still used to decide whether the group counts as active, and is
   * still navigated to when the sidebar is collapsed and there is no room to
   * show children.
   */
  children?: RecoverySidebarChild[]
  /** Omit to show to every authenticated user; set to restrict by role. */
  visibleFor?: RecoveryUserRole[]
}

/** Nav — matches the Recovery dashboard reference. Imports is an expandable group. */
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
    // Separate pages, same shape as Imports below. `visibleFor` on the parent
    // is what hides the whole group from a Company User; the pages behind
    // these links are owner-guarded client-side and their endpoints carry the
    // same role guard server-side.
    children: [
      { key: 'users-list', label: 'Users', link: '/users' },
      { key: 'users-connections', label: 'Connection Status', link: '/users/connections' },
      {
        key: 'users-deletion-requests',
        label: 'Deletion Requests',
        link: '/users/deletion-requests',
      },
    ],
  },
  {
    key: 'imports',
    label: 'Imports',
    iconSrc: '/images/importIcon.svg',
    link: '/imports',
    children: [
      { key: 'import-jobs', label: 'Import Jobs', link: '/imports' },
      {
        key: 'processable-shipments',
        label: 'Processable Shipments',
        link: '/imports/processable-shipments',
      },
      {
        key: 'unprocessed-documents',
        label: 'Unprocessed Documents',
        link: '/imports/unprocessed-documents',
      },
    ],
  },
  { key: 'settings', label: 'Settings', icon: 'icon-settings', link: '/settings' },
]
