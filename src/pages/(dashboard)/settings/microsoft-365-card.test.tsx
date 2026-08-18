import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { recoveryApi } from '@/app/services/recoveryApi'

import { Microsoft365Card } from './microsoft-365-card'

const mockShowCustomToast = jest.fn()

jest.mock('@/lib/showCustomToast', () => ({
  showCustomToast: (payload: unknown) => mockShowCustomToast(payload),
}))

// Mock all three RTK Query hooks used by the card
const mockRefetch = jest.fn()
const mockGetAuthUrl = jest.fn()
const mockDisconnect = jest.fn()

jest.mock('@/app/services/recoveryM365Api', () => ({
  ...jest.requireActual('@/app/services/recoveryM365Api'),
  useGetM365StatusQuery: jest.fn(),
  useGetM365AuthUrlMutation: jest.fn(),
  useDisconnectM365Mutation: jest.fn(),
}))

const { useGetM365StatusQuery, useGetM365AuthUrlMutation, useDisconnectM365Mutation } =
  jest.requireMock('@/app/services/recoveryM365Api')

function makeStore() {
  return configureStore({
    reducer: { [recoveryApi.reducerPath]: recoveryApi.reducer },
    middleware: (gDM) => gDM().concat(recoveryApi.middleware),
  })
}

type RenderOpts = { initialPath?: string }

function renderCard({ initialPath = '/settings' }: RenderOpts = {}) {
  const store = makeStore()
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/settings" element={<Microsoft365Card />} />
          <Route path="/imports" element={<div>Imports page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('Microsoft365Card', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: disconnected, not loading
    useGetM365StatusQuery.mockReturnValue({
      data: { content: { connected: false, email: null } },
      isLoading: false,
      refetch: mockRefetch,
    })
    useGetM365AuthUrlMutation.mockReturnValue([mockGetAuthUrl, { isLoading: false }])
    useDisconnectM365Mutation.mockReturnValue([mockDisconnect, { isLoading: false }])
  })

  it('renders a loading state while status is fetching', () => {
    useGetM365StatusQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetch,
    })
    renderCard()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the disconnected state by default', () => {
    renderCard()

    expect(
      screen.getByText(
        'Automatically import emails from your Microsoft 365 inbox to create and update matters.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('We only read your emails. We never send, delete, edit, or move them.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Microsoft 365' })).toBeInTheDocument()
  })

  it('renders the connected state when status says connected', () => {
    useGetM365StatusQuery.mockReturnValue({
      data: { content: { connected: true, email: 'jane@acme.com' } },
      isLoading: false,
      refetch: mockRefetch,
    })
    renderCard()

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Connected as jane@acme.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start an Import' })).toBeInTheDocument()
  })

  it('calls getAuthUrl and redirects when Connect is clicked', async () => {
    const originalHref = window.location.href
    mockGetAuthUrl.mockResolvedValue({
      data: { content: { url: 'https://login.microsoftonline.com/mock-url' } },
    })
    // unwrap is called on the result
    mockGetAuthUrl.mockReturnValue({
      unwrap: () =>
        Promise.resolve({ content: { url: 'https://login.microsoftonline.com/mock-url' } }),
    })

    // jsdom doesn't support navigation so spy on window.location.href setter
    const assignSpy = jest.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as Location)

    renderCard()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Connect Microsoft 365' }))
    })

    expect(mockGetAuthUrl).toHaveBeenCalled()
    assignSpy.mockRestore()
    window.location.href = originalHref
  })

  it('calls disconnect and shows toast when Disconnect is clicked', async () => {
    useGetM365StatusQuery.mockReturnValue({
      data: { content: { connected: true, email: 'jane@acme.com' } },
      isLoading: false,
      refetch: mockRefetch,
    })
    mockDisconnect.mockReturnValue({ unwrap: () => Promise.resolve({}) })

    renderCard()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    })

    expect(mockDisconnect).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockShowCustomToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: 'Microsoft 365 has been disconnected.',
        }),
      )
    })
  })

  it('navigates to imports when Start an Import is clicked', () => {
    useGetM365StatusQuery.mockReturnValue({
      data: { content: { connected: true, email: 'jane@acme.com' } },
      isLoading: false,
      refetch: mockRefetch,
    })
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Start an Import' }))

    expect(screen.getByText('Imports page')).toBeInTheDocument()
  })

  it('refetches status and shows success toast when redirected back with ?m365=connected', async () => {
    renderCard({ initialPath: '/settings?tab=integrations&m365=connected' })

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
      expect(mockShowCustomToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Microsoft 365 connected successfully.',
        }),
      )
    })
  })

  it('shows error toast when redirected back with ?m365=error', async () => {
    renderCard({ initialPath: '/settings?tab=integrations&m365=error' })

    await waitFor(() => {
      expect(mockShowCustomToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Could not connect to Microsoft 365. Please try again.',
        }),
      )
    })
  })
})
