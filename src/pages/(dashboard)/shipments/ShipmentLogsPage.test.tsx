import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import { ShipmentLogsPage } from './ShipmentLogsPage'

/**
 * Covers the log list's date-group heading: since a day with no new events gets no
 * group at all, the most recent (first) group's heading also carries the range
 * through today (e.g. "09/08/2026 - 11/08/2026") so it's clear nothing has changed
 * since. Older groups just show their own day, and a group that IS today's date
 * shows today's date plus the "Today" badge instead of a range.
 */

const mockUseGetRecoveryPreferencesQuery = jest.fn()
const mockUseGetRecoveryShipmentByIdQuery = jest.fn()
const mockUseGetRecoveryShipmentLogsQuery = jest.fn()

jest.mock('@/app/services/recoveryApi', () => ({
  useGetRecoveryPreferencesQuery: () => mockUseGetRecoveryPreferencesQuery(),
  useGetRecoveryShipmentByIdQuery: (...args: unknown[]) =>
    mockUseGetRecoveryShipmentByIdQuery(...args),
  useGetRecoveryShipmentLogsQuery: (...args: unknown[]) =>
    mockUseGetRecoveryShipmentLogsQuery(...args),
}))

function renderPage(id = 'ship-1') {
  return render(
    <MemoryRouter initialEntries={[`/shipments/${id}/logs`]}>
      <Routes>
        <Route path="/shipments/:id/logs" element={<ShipmentLogsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const EVENT = {
  _id: 'event-1',
  title: 'Shipment created',
  description: 'Shipment was created',
  time: '10:32 AM',
  color: 'green',
}

describe('ShipmentLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetRecoveryPreferencesQuery.mockReturnValue({
      data: { content: { timezone: 'UTC' } },
    })
    mockUseGetRecoveryShipmentByIdQuery.mockReturnValue({
      data: { content: { shipmentTitle: 'Widget shipment' } },
    })
  })

  it('appends the range through today to the most recent group when it is not today', () => {
    mockUseGetRecoveryShipmentLogsQuery.mockReturnValue({
      data: {
        content: {
          logs: [{ date: '2026-08-09T10:00:00Z', events: [EVENT] }],
          pagination: { totalPages: 1 },
        },
      },
      isLoading: false,
      isFetching: false,
    })

    renderPage()

    expect(screen.getByText(/09\/08\/2026 - \d{2}\/\d{2}\/2026/)).toBeInTheDocument()
    expect(screen.queryByText('Today')).not.toBeInTheDocument()
  })

  it('shows only the date plus the "Today" badge when the most recent group is today', () => {
    const today = new Date().toISOString()
    mockUseGetRecoveryShipmentLogsQuery.mockReturnValue({
      data: {
        content: {
          logs: [{ date: today, events: [EVENT] }],
          pagination: { totalPages: 1 },
        },
      },
      isLoading: false,
      isFetching: false,
    })

    renderPage()

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByText(/ - /)).not.toBeInTheDocument()
  })

  it('does not append a range to older groups after the first', () => {
    mockUseGetRecoveryShipmentLogsQuery.mockReturnValue({
      data: {
        content: {
          logs: [
            { date: '2026-08-10T10:00:00Z', events: [EVENT] },
            { date: '2026-08-09T10:00:00Z', events: [{ ...EVENT, _id: 'event-2' }] },
          ],
          pagination: { totalPages: 1 },
        },
      },
      isLoading: false,
      isFetching: false,
    })

    renderPage()

    expect(screen.getByText(/10\/08\/2026 - \d{2}\/\d{2}\/2026/)).toBeInTheDocument()
    expect(screen.getByText('09/08/2026')).toBeInTheDocument()
  })
})
