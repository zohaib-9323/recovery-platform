import { findScrollableAncestor } from './scrollable-ancestor'

/**
 * Guards the assumption that broke the terms modal twice: that the scrolling
 * element is `document.body`. Under the auth shell it is a mid-tree div, so
 * anything saving or restoring scroll has to resolve it at runtime.
 */
function build(overflowY: string, scrollHeight: number, clientHeight: number) {
  const outer = document.createElement('div')
  const inner = document.createElement('div')
  outer.style.overflowY = overflowY
  Object.defineProperty(outer, 'scrollHeight', { value: scrollHeight, configurable: true })
  Object.defineProperty(outer, 'clientHeight', { value: clientHeight, configurable: true })
  outer.appendChild(inner)
  document.body.appendChild(outer)
  return { outer, inner }
}

describe('findScrollableAncestor', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('finds an ancestor that actually scrolls', () => {
    const { outer, inner } = build('auto', 2000, 500)
    expect(findScrollableAncestor(inner)).toBe(outer)
  })

  it('skips an overflow-auto ancestor whose content fits', () => {
    const { inner } = build('auto', 400, 500)
    expect(findScrollableAncestor(inner)).not.toBeInstanceOf(HTMLDivElement)
  })

  it('skips an overflow-hidden ancestor', () => {
    const { inner } = build('hidden', 2000, 500)
    expect(findScrollableAncestor(inner)).not.toBeInstanceOf(HTMLDivElement)
  })

  it('returns null for a detached element with no scrolling ancestor', () => {
    expect(findScrollableAncestor(document.createElement('div'))).toBeNull()
  })
})
