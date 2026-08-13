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
  if (path === '/notifications' || path.startsWith('/notifications/')) {
    return ''
  }
  if (path === '/settings' || path.startsWith('/settings/')) {
    return ''
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
  if (path === '/notifications' || path.startsWith('/notifications/')) {
    return 'Notifications'
  }
  if (path === '/imports' || path.startsWith('/imports/')) {
    return 'Imports'
  }
  if (path.startsWith('/dashboard')) {
    return 'Platform'
  }
  return ''
}
