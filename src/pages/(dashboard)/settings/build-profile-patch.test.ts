import { buildProfilePatch, type ProfileFormValues } from './build-profile-patch'

import type { RecoveryUserProfile } from '@/types/recovery-user-api'

function makeProfile(overrides: Partial<RecoveryUserProfile> = {}): RecoveryUserProfile {
  return {
    email: 'user@example.com',
    firstName: 'Alice',
    lastName: 'Stone',
    dob: '1999-01-20T00:00:00.000Z',
    country: 'UK',
    city: 'London',
    phone: '+447700900000',
    profilePic: undefined,
    ...overrides,
  }
}

function toForm(overrides: Partial<ProfileFormValues> = {}): ProfileFormValues {
  return {
    firstName: 'Alice',
    lastName: 'Stone',
    dob: '1999-01-20',
    country: 'UK',
    city: 'London',
    phone: '+447700900000',
    ...overrides,
  }
}

describe('buildProfilePatch', () => {
  it('returns empty patch when no field changed', () => {
    const patch = buildProfilePatch(makeProfile(), toForm(), null)
    expect(patch).toEqual({})
  })

  it('builds patch only with changed fields and trims values', () => {
    const patch = buildProfilePatch(
      makeProfile(),
      toForm({
        firstName: '  Bob ',
        city: '  Manchester ',
      }),
      null,
    )
    expect(patch).toEqual({
      firstName: 'Bob',
      city: 'Manchester',
    })
  })

  it('adds profile picture override when provided', () => {
    const patch = buildProfilePatch(makeProfile(), toForm(), 'data:image/png;base64,abc123')
    expect(patch).toEqual({
      profilePic: 'data:image/png;base64,abc123',
    })
  })

  it('normalizes dob field to date-only and updates when changed', () => {
    const patch = buildProfilePatch(makeProfile(), toForm({ dob: '2001-05-04T12:00:00Z' }), null)
    expect(patch).toEqual({
      dob: '2001-05-04',
    })
  })
})
