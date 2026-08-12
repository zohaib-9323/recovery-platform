/** Mirrors trade-harmonizer's `getTimeAgo` so notification timestamps read the same across apps. */
export function getTimeAgo(createdAt?: string | Date): string {
  if (!createdAt) return ''
  const createdDate = new Date(createdAt)
  const now = new Date()
  const diffInMs = now.getTime() - createdDate.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Just now'
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`
  }
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  const days = Math.floor(diffInMinutes / 1440)
  return `${days} day${days > 1 ? 's' : ''} ago`
}
