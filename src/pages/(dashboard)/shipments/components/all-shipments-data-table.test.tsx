import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import { AllShipmentsDataTable, type ManageShipmentsTableRow } from './all-shipments-data-table'

/** Covers the "empty cell should show N/A" fix for Ship Via / PO # columns. */

const ROW_WITH_DATA: ManageShipmentsTableRow = {
  _id: 'ship-1',
  shipmentTitle: 'Widget shipment',
  dateRaw: '2024-01-07',
  createdAtRaw: '2024-01-01',
  shipVia: 'air',
  purchaseOrderNumber: 'PO-123',
  status: 5,
  c88DocumentUrl: '',
  hasC88Document: false,
}

const ROW_MISSING_DATA: ManageShipmentsTableRow = {
  _id: 'ship-2',
  shipmentTitle: 'Untitled shipment',
  dateRaw: null,
  createdAtRaw: null,
  shipVia: '',
  purchaseOrderNumber: '',
  status: 3,
  c88DocumentUrl: '',
  hasC88Document: false,
}

function renderTable(data: ManageShipmentsTableRow[]) {
  return render(
    <MemoryRouter>
      <AllShipmentsDataTable data={data} selectedUserIds={[]} onCheckChange={jest.fn()} />
    </MemoryRouter>,
  )
}

describe('AllShipmentsDataTable', () => {
  it('renders the real Ship Via / PO # values when present', () => {
    renderTable([ROW_WITH_DATA])
    expect(screen.getByText('air')).toBeInTheDocument()
    expect(screen.getByText('PO-123')).toBeInTheDocument()
  })

  it('shows "N/A" instead of a blank cell for missing Ship Via / PO #', () => {
    renderTable([ROW_MISSING_DATA])
    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(2)
  })
})
