import { toManageUserRow } from './manage-users-mappers'
import type { CompanyUserListItem } from '@/types/recovery-company-users-api'

function makeItem(overrides: Partial<CompanyUserListItem> = {}): CompanyUserListItem {
  return {
    _id: '1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@acmecorp.com',
    status: 'active',
    role: 'recovery_company_user',
    joiningDate: '2026-03-01T00:00:00.000Z',
    profilePic: '',
    ...overrides,
  }
}

describe('toManageUserRow', () => {
  it('maps the API item into the existing table row shape', () => {
    expect(toManageUserRow(makeItem())).toEqual({
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@acmecorp.com',
      joiningDate: '01/03/2026',
      status: 'active',
    })
  })

  it('maps a suspended status through', () => {
    expect(toManageUserRow(makeItem({ status: 'suspended' })).status).toBe('suspended')
  })

  it('falls back to active for any non-suspended status (e.g. pending)', () => {
    expect(toManageUserRow(makeItem({ status: 'pending' })).status).toBe('active')
  })

  it('falls back to an empty joining date string for an unparseable value', () => {
    expect(toManageUserRow(makeItem({ joiningDate: '' })).joiningDate).toBe('')
  })
})
