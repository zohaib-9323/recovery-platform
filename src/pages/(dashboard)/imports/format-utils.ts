// ── Shared formatting helpers for the import job detail page ──────────────────

export function formatReceived(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

/**
 * Label for the folder(s) an import job covers.
 *
 * A job can span several folders (Inbox + Sent Items + Archive) from one user
 * action. Falls back to the single `folderName` for jobs created before
 * multi-folder support, whose `folders` array is empty.
 */
export function formatFolders(
  folders: Array<{ folderName: string }> | undefined,
  fallbackName: string,
): string {
  const names = (folders ?? []).map((f) => f.folderName).filter(Boolean)
  if (names.length === 0) {
    return fallbackName
  }
  if (names.length <= 2) {
    return names.join(', ')
  }
  return `${names[0]}, ${names[1]} +${names.length - 2} more`
}
