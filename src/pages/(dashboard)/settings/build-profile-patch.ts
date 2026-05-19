import type { RecoveryProfilePatchBody, RecoveryUserProfile } from '@/types/recovery-user-api'

function norm(s: string | undefined): string {
  return (s ?? '').trim()
}

export type ProfileFormValues = {
  firstName: string
  lastName: string
  dob: string
  country: string
  city: string
  phone: string
}

export function buildProfilePatch(
  original: RecoveryUserProfile,
  current: ProfileFormValues,
  profilePicOverride: string | null,
): RecoveryProfilePatchBody {
  const patch: RecoveryProfilePatchBody = {}

  if (norm(current.firstName) !== norm(original.firstName)) {
    patch.firstName = norm(current.firstName)
  }
  if (norm(current.lastName) !== norm(original.lastName)) {
    patch.lastName = norm(current.lastName)
  }

  const origDob = norm(original.dob)?.slice(0, 10) ?? ''
  const curDob = norm(current.dob)?.slice(0, 10) ?? ''
  if (curDob !== origDob) {
    patch.dob = curDob || ''
  }

  if (norm(current.country) !== norm(original.country)) {
    patch.country = norm(current.country)
  }
  if (norm(current.city) !== norm(original.city)) {
    patch.city = norm(current.city)
  }
  if (norm(current.phone) !== norm(original.phone)) {
    patch.phone = norm(current.phone)
  }

  if (profilePicOverride !== null) {
    patch.profilePic = profilePicOverride
  }

  return patch
}
