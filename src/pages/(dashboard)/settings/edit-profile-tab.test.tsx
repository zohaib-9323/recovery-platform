import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { EditProfileTab } from './edit-profile-tab'

const mockPatchProfile = jest.fn()
const mockDispatch = jest.fn()
const mockRefetch = jest.fn()
const mockUseGetRecoveryProfileQuery = jest.fn()
const mockUsePatchRecoveryProfileMutation = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useGetRecoveryProfileQuery: () => mockUseGetRecoveryProfileQuery(),
  usePatchRecoveryProfileMutation: () => mockUsePatchRecoveryProfileMutation(),
}))

jest.mock('@/app/redux-hooks', () => ({
  useAppDispatch: () => mockDispatch,
}))

const defaultProfile = {
  id: 10,
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Stone',
  dob: '2000-01-20T00:00:00.000Z',
  country: 'UK',
  city: 'London',
  phone: '+447700900000',
  profilePic: null,
}

describe('EditProfileTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRefetch.mockResolvedValue(undefined)
  })

  it('submits patch only with changed values', async () => {
    mockUseGetRecoveryProfileQuery.mockReturnValue({
      data: {
        content: defaultProfile,
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
      fulfilledTimeStamp: 11,
    })
    mockUsePatchRecoveryProfileMutation.mockReturnValue([mockPatchProfile, { isLoading: false }])
    mockPatchProfile.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          status: true,
          message: 'Profile updated.',
          content: {
            firstName: 'Alice',
            lastName: 'Walker',
            profilePic: null,
          },
        }),
    })

    render(<EditProfileTab />)

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Walker' } })
    expect(screen.getByRole('button', { name: 'Save changes' })).not.toBeDisabled()

    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Stone' } })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Walker' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockPatchProfile).toHaveBeenCalledWith({ lastName: 'Walker' })
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    })
  })

  it('renders api error on mutation failure', async () => {
    mockUseGetRecoveryProfileQuery.mockReturnValue({
      data: {
        content: defaultProfile,
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
      fulfilledTimeStamp: 12,
    })
    mockUsePatchRecoveryProfileMutation.mockReturnValue([mockPatchProfile, { isLoading: false }])
    mockPatchProfile.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Cannot update profile' } }),
    })

    render(<EditProfileTab />)

    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Leeds' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot update profile')
  })

  it('keeps save disabled when any required field is empty', () => {
    mockUseGetRecoveryProfileQuery.mockReturnValue({
      data: { content: defaultProfile },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
      fulfilledTimeStamp: 13,
    })
    mockUsePatchRecoveryProfileMutation.mockReturnValue([mockPatchProfile, { isLoading: false }])

    render(<EditProfileTab />)

    fireEvent.change(screen.getByLabelText('City'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('rejects date of birth after today', () => {
    mockUseGetRecoveryProfileQuery.mockReturnValue({
      data: { content: defaultProfile },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
      fulfilledTimeStamp: 14,
    })
    mockUsePatchRecoveryProfileMutation.mockReturnValue([mockPatchProfile, { isLoading: false }])

    render(<EditProfileTab />)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const value = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-')

    fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value } })
    expect(screen.getByText('Date of birth cannot be after today.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('validates phone number before allowing save', () => {
    mockUseGetRecoveryProfileQuery.mockReturnValue({
      data: { content: defaultProfile },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
      fulfilledTimeStamp: 15,
    })
    mockUsePatchRecoveryProfileMutation.mockReturnValue([mockPatchProfile, { isLoading: false }])

    render(<EditProfileTab />)

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: 'invalid-phone' } })
    expect(screen.getByText('Enter a valid phone number.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+447700900123' } })
    expect(screen.queryByText('Enter a valid phone number.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).not.toBeDisabled()
  })
})
