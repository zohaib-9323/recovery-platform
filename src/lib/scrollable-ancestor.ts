/**
 * Finds the nearest ancestor that actually scrolls `el`.
 *
 * Which element scrolls a page is a layout detail that moves around — the
 * signup form has been scrolled by its own root, by its layout shell, and by
 * the document at different points. Anything that needs to save or restore a
 * scroll position has to ask at runtime rather than assume `document.body`,
 * which under a `h-dvh overflow-hidden` shell never scrolls at all.
 *
 * Returns `null` when nothing between `el` and the document scrolls.
 */
export function findScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null

  while (node) {
    const { overflowY } = window.getComputedStyle(node)
    const scrolls = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (scrolls && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }

  const doc = document.scrollingElement as HTMLElement | null
  return doc && doc.scrollHeight > doc.clientHeight ? doc : null
}
