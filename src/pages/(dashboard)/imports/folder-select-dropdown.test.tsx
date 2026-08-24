import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import { FolderSelectDropdown, type FolderOption } from './folder-select-dropdown'

const OPTIONS: FolderOption[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent', label: 'Sent Items' },
  { value: 'archive', label: 'Archive' },
]

/** Wrapper so the component drives real state, like the import modal does. */
function Harness({ initial = [] as string[] }) {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <>
      <FolderSelectDropdown value={value} onChange={setValue} options={OPTIONS} />
      <span data-testid="selection">{value.join(',')}</span>
    </>
  )
}

const openList = () => fireEvent.click(screen.getAllByRole('button')[0])
const clickOk = () => fireEvent.click(screen.getByRole('button', { name: 'OK' }))
const clickCancel = () => fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
const selection = () => screen.getByTestId('selection').textContent

describe('FolderSelectDropdown (multi-select)', () => {
  it('commits several folders in one go when OK is pressed', () => {
    render(<Harness />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Inbox/ }))
    fireEvent.click(screen.getByRole('option', { name: /Sent Items/ }))
    fireEvent.click(screen.getByRole('option', { name: /Archive/ }))
    clickOk()
    expect(selection()).toBe('inbox,sent,archive')
  })

  it('stages picks without changing the selection until OK', () => {
    render(<Harness initial={['inbox']} />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Archive/ }))
    expect(selection()).toBe('inbox')
    clickOk()
    expect(selection()).toBe('inbox,archive')
  })

  it('discards staged picks on Cancel, keeping the previous selection', () => {
    render(<Harness initial={['inbox']} />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Archive/ }))
    fireEvent.click(screen.getByRole('option', { name: /Sent Items/ }))
    clickCancel()
    expect(selection()).toBe('inbox')
  })

  it('reopens from the committed selection after a Cancel', () => {
    render(<Harness initial={['inbox']} />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Archive/ }))
    clickCancel()
    openList()
    expect(screen.getByRole('option', { name: /Archive/ })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('closes and discards when clicking outside the dropdown', () => {
    render(<Harness initial={['inbox']} />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Archive/ }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(selection()).toBe('inbox')
  })

  it('stays open while picking, so multiple choices do not need re-opening', () => {
    render(<Harness />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Inbox/ }))
    // The listbox is still mounted — a single-select would have closed here.
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('deselects a folder when clicked again', () => {
    render(<Harness initial={['inbox', 'sent']} />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Inbox/ }))
    clickOk()
    expect(selection()).toBe('sent')
  })

  it('marks selected options for assistive tech', () => {
    render(<Harness initial={['inbox']} />)
    openList()
    expect(screen.getByRole('option', { name: /Inbox/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: /Archive/ })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable')
  })

  it('summarises the trigger instead of listing every folder', () => {
    render(<Harness initial={['inbox', 'sent', 'archive']} />)
    expect(screen.getByRole('button', { name: /\+1 more/ })).toBeInTheDocument()
  })

  it('prompts the user when nothing is selected', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: /Select folders/ })).toBeInTheDocument()
  })
})
