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
const selection = () => screen.getByTestId('selection').textContent

describe('FolderSelectDropdown (multi-select)', () => {
  it('lets several folders be selected in one go', () => {
    render(<Harness />)
    openList()
    fireEvent.click(screen.getByRole('option', { name: /Inbox/ }))
    fireEvent.click(screen.getByRole('option', { name: /Sent Items/ }))
    fireEvent.click(screen.getByRole('option', { name: /Archive/ }))
    expect(selection()).toBe('inbox,sent,archive')
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
