import { renderHook } from '@testing-library/react'

import { useNotificationToasts } from '@/app/hooks/useNotificationToasts'
import { IMPORT_LIST_REFRESH_EVENT } from '@/lib/importRealtime'
import type { RecoveryNotificationRecord } from '@/types/recovery-notifications-api'

const mockShowCustomToast = jest.fn()
const mockNavigate = jest.fn()
let mockQueryResult: { data?: unknown } = {}

jest.mock('@/lib/showCustomToast', () => ({
  showCustomToast: (...args: unknown[]) => mockShowCustomToast(...args),
}))
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))
jest.mock('@/app/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true }) }))
jest.mock('@/app/services/recoveryNotificationsApi', () => ({
  useGetRecoveryNotificationsQuery: () => ({ ...mockQueryResult, refetch: jest.fn() }),
}))

const record = (id: string, over: Partial<RecoveryNotificationRecord> = {}) => ({
  _id: id,
  title: `title ${id}`,
  description: `body ${id}`,
  isRead: false,
  ...over,
})

/** Newest first, the order the API returns. */
const page = (items: Array<Partial<RecoveryNotificationRecord> & { _id: string }>) => ({
  data: { content: { data: items } },
})

describe('useNotificationToasts', () => {
  beforeEach(() => {
    mockShowCustomToast.mockClear()
    mockNavigate.mockClear()
    mockQueryResult = {}
  })

  it('does not toast the backlog already present on first load', () => {
    mockQueryResult = page([record('a'), record('b')])
    renderHook(() => useNotificationToasts())

    expect(mockShowCustomToast).not.toHaveBeenCalled()
  })

  it('toasts only notifications that arrive after the baseline', () => {
    mockQueryResult = page([record('a')])
    const { rerender } = renderHook(() => useNotificationToasts())

    mockQueryResult = page([record('b'), record('a')])
    rerender()

    expect(mockShowCustomToast).toHaveBeenCalledTimes(1)
    expect(mockShowCustomToast.mock.calls[0][0]).toMatchObject({ title: 'title b' })
  })

  it('does not re-toast a notification still sitting in the window', () => {
    mockQueryResult = page([record('a')])
    const { rerender } = renderHook(() => useNotificationToasts())

    mockQueryResult = page([record('b'), record('a')])
    rerender()
    rerender()

    expect(mockShowCustomToast).toHaveBeenCalledTimes(1)
  })

  it('caps a burst and toasts oldest first so the newest lands on top', () => {
    mockQueryResult = page([record('a')])
    const { rerender } = renderHook(() => useNotificationToasts())

    // Five new ones at once, newest (e) first.
    mockQueryResult = page([record('e'), record('d'), record('c'), record('b'), record('a')])
    rerender()

    expect(mockShowCustomToast).toHaveBeenCalledTimes(3)
    const titles = mockShowCustomToast.mock.calls.map((call) => call[0].title)
    expect(titles).toEqual(['title c', 'title d', 'title e'])
  })

  it('asks the Imports screens to refresh when an import status notification arrives', () => {
    const onRefresh = jest.fn()
    window.addEventListener(IMPORT_LIST_REFRESH_EVENT, onRefresh)

    mockQueryResult = page([record('a')])
    const { rerender } = renderHook(() => useNotificationToasts())

    mockQueryResult = page([
      record('b', { options: { type: 'm365_import_status_update', status: 'completed' } }),
      record('a'),
    ])
    rerender()

    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(mockShowCustomToast.mock.calls[0][0]).toMatchObject({ type: 'success' })
    window.removeEventListener(IMPORT_LIST_REFRESH_EVENT, onRefresh)
  })

  it('leaves the Imports screens alone for unrelated notifications', () => {
    const onRefresh = jest.fn()
    window.addEventListener(IMPORT_LIST_REFRESH_EVENT, onRefresh)

    mockQueryResult = page([record('a')])
    const { rerender } = renderHook(() => useNotificationToasts())

    mockQueryResult = page([record('b', { options: { shipmentId: 's1' } }), record('a')])
    rerender()

    expect(onRefresh).not.toHaveBeenCalled()
    window.removeEventListener(IMPORT_LIST_REFRESH_EVENT, onRefresh)
  })

  it('navigates to the notification target when the toast is clicked', () => {
    mockQueryResult = page([record('a')])
    const { rerender } = renderHook(() => useNotificationToasts())

    mockQueryResult = page([record('b', { screenName: '/imports/job-1' }), record('a')])
    rerender()

    const options = mockShowCustomToast.mock.calls[0][0].options
    options.onClick()
    expect(mockNavigate).toHaveBeenCalledWith('/imports/job-1')
  })
})
