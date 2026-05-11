import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PreferencesTab } from './preferences-tab'

const mockPostPreferences = jest.fn()
const mockShowCustomToast = jest.fn()
const mockUseGetRecoveryPreferencesQuery = jest.fn()
const mockUsePostRecoveryPreferencesMutation = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useGetRecoveryPreferencesQuery: () => mockUseGetRecoveryPreferencesQuery(),
  usePostRecoveryPreferencesMutation: () => mockUsePostRecoveryPreferencesMutation(),
}))

jest.mock('@/lib/showCustomToast', () => ({
  showCustomToast: (payload: unknown) => mockShowCustomToast(payload),
}))

describe('PreferencesTab', () => {
  jest.setTimeout(15000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits updated preferences', async () => {
    mockUseGetRecoveryPreferencesQuery.mockReturnValue({
      data: {
        content: { currency: 'USD', timezone: 'UTC' },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      fulfilledTimeStamp: 1,
    })
    mockUsePostRecoveryPreferencesMutation.mockReturnValue([
      mockPostPreferences,
      { isLoading: false },
    ])
    mockPostPreferences.mockReturnValue({
      unwrap: () => Promise.resolve({ status: true, message: 'Preferences saved.' }),
    })

    render(<PreferencesTab />)

    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'GBP' } })
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'Europe/London' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockPostPreferences).toHaveBeenCalledWith({
        currency: 'GBP',
        timezone: 'Europe/London',
      })
    })
    expect(mockShowCustomToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Preferences saved.',
      message: 'Preferences saved.',
    })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('shows api error message when mutation fails', async () => {
    mockUseGetRecoveryPreferencesQuery.mockReturnValue({
      data: {
        content: { currency: 'USD', timezone: 'UTC' },
      },
      isLoading: false,
      isFetching: false,
      error: null,
      fulfilledTimeStamp: 2,
    })
    mockUsePostRecoveryPreferencesMutation.mockReturnValue([
      mockPostPreferences,
      { isLoading: false },
    ])
    mockPostPreferences.mockReturnValue({
      unwrap: () => Promise.reject({ data: { message: 'Request denied' } }),
    })

    render(<PreferencesTab />)

    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'EUR' } })
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'Europe/Berlin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockShowCustomToast).toHaveBeenCalledWith({
        type: 'error',
        title: 'Could not save preferences.',
        message: 'Request denied',
      })
    })
  })
})
