import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import microsoftIntegrationReducer from '@/app/features/integrations/microsoftIntegrationSlice'

import { Microsoft365Card } from './microsoft-365-card'

const mockUseAuth = jest.fn()
const mockShowCustomToast = jest.fn()

jest.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('@/lib/showCustomToast', () => ({
  showCustomToast: (payload: unknown) => mockShowCustomToast(payload),
}))

function renderCard() {
  const store = configureStore({
    reducer: { microsoftIntegration: microsoftIntegrationReducer },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/settings']}>
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
    mockUseAuth.mockReturnValue({ user: { email: 'jane@acme.com' } })
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

  it('switches to the connected state when the connect button is clicked', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Connect Microsoft 365' }))

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Connected as jane@acme.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start an Import' })).toBeInTheDocument()
    expect(mockShowCustomToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Microsoft 365',
      message: 'Connected as jane@acme.com',
    })
  })

  it('switches back to the disconnected state when disconnect is clicked', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Connect Microsoft 365' }))
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))

    expect(screen.getByRole('button', { name: 'Connect Microsoft 365' })).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
    expect(mockShowCustomToast).toHaveBeenCalledWith({
      type: 'info',
      title: 'Microsoft 365',
      message: 'Microsoft 365 has been disconnected.',
    })
  })

  it('navigates to the imports start-import flow when Start an Import is clicked', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Connect Microsoft 365' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start an Import' }))

    expect(screen.getByText('Imports page')).toBeInTheDocument()
  })
})
