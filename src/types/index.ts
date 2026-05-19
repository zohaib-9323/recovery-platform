export type User = {
  id: string
  email: string
  displayName?: string
  /** Avatar URL from profile API (optional; not present in JWT alone). */
  profilePic?: string
}
