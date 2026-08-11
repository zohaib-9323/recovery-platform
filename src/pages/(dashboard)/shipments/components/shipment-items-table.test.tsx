import { fireEvent, render, screen } from '@testing-library/react'

import type { RecoveryShipmentItem } from '@/types/recovery-shipments-api'
import { ShipmentItemsTable } from './shipment-items-table'

/**
 * Covers two fixes to the Shipment Items table:
 * 1. "Challenge HS Code" and "Preferential Duty" are collapsed into a single
 *    three-dot row action menu instead of two always-visible buttons.
 * 2. Empty item fields (itemNumber/description/hsCode/qty) render "N/A"
 *    instead of a blank cell.
 */

const ITEM_WITH_HS_CODE: RecoveryShipmentItem = {
  id: 'item-1',
  itemNumber: '1',
  description: 'Widget',
  qty: 10,
  unitPrice: 5,
  hsCode: '1234567890',
  duty: 1,
  totalPrice: 50,
  landedCost: 51,
}

const ITEM_WITHOUT_DATA: RecoveryShipmentItem = {
  id: 'item-2',
  itemNumber: null as unknown as string,
  description: null as unknown as string,
  qty: null as unknown as number,
  hsCode: null as unknown as string,
}

function openRowMenu(rowTestText: string) {
  const row = screen.getByText(rowTestText).closest('tr')!
  const trigger = row.querySelector('button')!
  fireEvent.click(trigger)
}

describe('ShipmentItemsTable', () => {
  it('renders a single three-dot action menu per row instead of two standalone buttons', () => {
    render(
      <ShipmentItemsTable
        items={[ITEM_WITH_HS_CODE]}
        onChallenge={jest.fn()}
        onViewPreferentialDuty={jest.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Challenge HS Code' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Preferential Duty' })).not.toBeInTheDocument()

    openRowMenu('Widget')

    expect(screen.getByText('Challenge HS Code')).toBeInTheDocument()
    expect(screen.getByText('Preferential Duty')).toBeInTheDocument()
  })

  it('calls onChallenge / onViewPreferentialDuty when their menu items are selected', () => {
    const onChallenge = jest.fn()
    const onViewPreferentialDuty = jest.fn()
    render(
      <ShipmentItemsTable
        items={[ITEM_WITH_HS_CODE]}
        onChallenge={onChallenge}
        onViewPreferentialDuty={onViewPreferentialDuty}
      />,
    )

    openRowMenu('Widget')
    fireEvent.click(screen.getByText('Preferential Duty'))
    expect(onViewPreferentialDuty).toHaveBeenCalledWith(ITEM_WITH_HS_CODE)

    openRowMenu('Widget')
    fireEvent.click(screen.getByText('Challenge HS Code'))
    expect(onChallenge).toHaveBeenCalledWith(ITEM_WITH_HS_CODE)
  })

  it('disables the Preferential Duty menu item when the item has no HS code', () => {
    const itemNoHsCode = { ...ITEM_WITH_HS_CODE, hsCode: undefined }
    render(<ShipmentItemsTable items={[itemNoHsCode]} onViewPreferentialDuty={jest.fn()} />)

    openRowMenu('Widget')
    expect(screen.getByText('Preferential Duty').closest('button')).toBeDisabled()
  })

  it('shows "N/A" instead of a blank cell for missing itemNumber/description/hsCode/qty', () => {
    render(<ShipmentItemsTable items={[ITEM_WITHOUT_DATA]} />)

    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(4)
  })

  it('does not render an action menu when neither handler is provided', () => {
    render(<ShipmentItemsTable items={[ITEM_WITH_HS_CODE]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
