export type RecoverySidebarItem = {
  key: string
  label: string
  icon: string
  link: string
}

/** Flat nav — matches Recovery dashboard reference (Dashboard, All Shipments, Inbox). */
export const recoverySidebarItems: RecoverySidebarItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'icon-home', link: '/dashboard' },
  { key: 'shipments', label: 'All Shipments', icon: 'icon-box', link: '/shipments' },
  { key: 'inbox', label: 'Inbox', icon: 'icon-mail', link: '/inbox' },
]
