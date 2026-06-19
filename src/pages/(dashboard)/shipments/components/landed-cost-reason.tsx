import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export function LandedCostReason({ reason, isFlagged }: { reason: string; isFlagged: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const paragraphRef = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const checkOverflow = () => {
      const el = paragraphRef.current
      if (el) {
        setIsOverflowing(el.scrollHeight > el.clientHeight)
      }
    }
    checkOverflow()
    const timeoutId = setTimeout(checkOverflow, 100)
    return () => clearTimeout(timeoutId)
  }, [reason])

  useEffect(() => {
    let debounceTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        const el = paragraphRef.current
        if (el) {
          setIsOverflowing(el.scrollHeight > el.clientHeight)
        }
      }, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(debounceTimeout)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div>
      <p
        ref={paragraphRef}
        className={`break-words text-sm font-normal transition-all duration-300 ease-in-out ${
          isFlagged || reason === 'Total Landed Cost Mismatch.' ? 'text-redOne' : 'text-green'
        } ${!expanded ? 'line-clamp-3' : ''}`}
      >
        {reason}
      </p>
      {isOverflowing ? (
        <button
          type="button"
          className="mt-1 text-xs text-blue"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </div>
  )
}
