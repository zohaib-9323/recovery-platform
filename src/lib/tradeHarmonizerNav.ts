/**
 * Top bar: two-part title (prefix + suffix), uppercased in `AppHeader`.
 * Home uses “Recovery” + “Platform”; feature routes use their own labels (no generic home branding).
 */

function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/'
  return p
}

export function getSideBarTitle(pathname: string): string {
  const path = normalizePath(pathname)
  if (path === '/shipments' || path.startsWith('/shipments/')) {
    return 'All'
  }
  if (path === '/inbox' || path.startsWith('/inbox/')) {
    return ''
  }
  if (path === '/users' || path.startsWith('/users/')) {
    return 'Manage'
  }
  if (path === '/notifications' || path.startsWith('/notifications/')) {
    return ''
  }
  if (path === '/settings' || path.startsWith('/settings/')) {
    return ''
  }
  // The Imports sub-screens are the only two-level titles in the app: the
  // section stays in the prefix so the header reads "IMPORTS / <SCREEN>".
  if (path === '/imports/processable-shipments' || path === '/imports/unprocessed-documents') {
    return 'Imports /'
  }
  if (path === '/imports' || path.startsWith('/imports/')) {
    return ''
  }
  if (path === '/dashboard') {
    return 'Recovery'
  }
  if (path.startsWith('/dashboard')) {
    return 'Recovery'
  }
  return ''
}

export function getHrefLink(pathname: string): string {
  const path = normalizePath(pathname)
  if (path === '/settings' || path.startsWith('/settings/')) {
    return 'Settings'
  }
  if (path === '/dashboard') {
    return 'Platform'
  }
  if (path === '/shipments' || path.startsWith('/shipments/')) {
    return 'Shipments'
  }
  if (path === '/inbox' || path.startsWith('/inbox/')) {
    return 'Inbox'
  }
  if (path === '/users' || path.startsWith('/users/')) {
    return 'Users'
  }
  if (path === '/notifications' || path.startsWith('/notifications/')) {
    return 'Notifications'
  }
  if (path === '/imports/processable-shipments') {
    return 'Processable Shipments'
  }
  if (path === '/imports/unprocessed-documents') {
    return 'Unprocessed Documents'
  }
  if (path === '/imports' || path.startsWith('/imports/')) {
    return 'Imports'
  }
  if (path.startsWith('/dashboard')) {
    return 'Platform'
  }
  return ''
}
