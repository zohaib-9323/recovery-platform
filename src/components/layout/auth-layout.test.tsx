import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthLayout } from './auth-layout'

/**
 * The signup shell must produce EXACTLY ONE scrollbar.
 *
 * This has broken twice. When the shell overflows, the browser adds a document
 * scrollbar alongside the intended inner one, the page and the form scroll
 * independently, and opening the terms modal shifts the form by half a screen
 * with no way back. The classes asserted here are the ones that prevent it —
 * `min-h-0` in particular, without which the flex child refuses to shrink below
 * its content (`min-height: auto`) and grows to the full height of the form.
 */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path={path} element={<div style={{ height: 5000 }}>tall form</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthLayout — signup shell', () => {
  it('has exactly one scrolling element', () => {
    const { container } = renderAt('/signup')

    const scrollers = container.querySelectorAll(
      '.overflow-y-auto, .overflow-auto, .overflow-y-scroll',
    )
    expect(scrollers).toHaveLength(1)
  })

  it('takes the shell out of flow so the document itself cannot scroll', () => {
    const { container } = renderAt('/signup')

    const shell = container.firstElementChild as HTMLElement
    // Global CSS puts `min-height: 100vh` on both body and #root, so an
    // in-flow full-height shell can push the document past the viewport and
    // earn it a SECOND scrollbar. `fixed inset-0` contributes no height at all.
    expect(shell.className).toContain('fixed')
    expect(shell.className).toContain('inset-0')
    expect(shell.className).toContain('overflow-hidden')
    expect(shell.className).not.toContain('h-dvh')
  })

  it('lets the scrolling child shrink below its content', () => {
    const { container } = renderAt('/signup')

    const scroller = container.querySelector('.overflow-y-auto') as HTMLElement
    // Without min-h-0 a flex item's min-height:auto keeps it at content height,
    // the shell overflows, and a second (document) scrollbar appears.
    expect(scroller.className).toContain('min-h-0')
    expect(scroller.className).toMatch(/\bflex-1\b|\bflex-grow\b/)
  })

  it('keeps the login shell unchanged', () => {
    const { container } = renderAt('/login')

    // The centred split-screen shell is correct for the short auth cards and is
    // deliberately not the signup one.
    expect(container.querySelector('.md\\:w-3\\/5')).toBeTruthy()
  })
})
