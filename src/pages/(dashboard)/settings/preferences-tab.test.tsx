import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PreferencesTab } from './preferences-tab'

const mockPostPreferences = jest.fn()
const mockUseGetRecoveryPreferencesQuery = jest.fn()
const mockUsePostRecoveryPreferencesMutation = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useGetRecoveryPreferencesQuery: () => mockUseGetRecoveryPreferencesQuery(),
  usePostRecoveryPreferencesMutation: () => mockUsePostRecoveryPreferencesMutation(),
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
    expect(screen.getByText('Preferences saved.')).toBeInTheDocument()
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

    expect(await screen.findByRole('alert')).toHaveTextContent('Request denied')
  })
})
