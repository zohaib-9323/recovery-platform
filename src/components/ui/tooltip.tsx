import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { MS } from '@/lib/manage-shipments-copy'

import { computeTooltipLayout } from './tooltip-layout'

const breakpointOrder = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<(typeof breakpointOrder)[number]>('base')

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else if (width >= 640) setBreakpoint('sm')
      else setBreakpoint('base')
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])

  return { breakpoint }
}

export type TooltipProps = {
  content?: string
  heading?: string
  position?: string
  width?: string
  children: ReactNode
  customContent?: ReactNode
  disabled?: boolean
  contentStyles?: string
  tooltipStyles?: string
}

export function Tooltip({
  content,
  heading = MS.statusInfo,
  position = 'bottom',
  width = 'w-64',
  children,
  customContent,
  disabled = false,
  contentStyles,
  tooltipStyles,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [finalPosition, setFinalPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  const [, setHasCalculatedPosition] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [arrowOffset, setArrowOffset] = useState({ left: 0, top: 0 })

  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const { breakpoint } = useBreakpoint()

  const isTouchDevice =
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const resolveResponsivePosition = () => {
    const tokens = position.split(' ')
    const parsed = tokens.map((token) => {
      if (token.includes(':')) {
        const [bp, pos] = token.split(':')
        return { bp: bp as (typeof breakpointOrder)[number], pos }
      }
      return { bp: 'base' as const, pos: token }
    })

    const currentIndex = breakpointOrder.indexOf(breakpoint)
    for (let i = currentIndex; i >= 0; i--) {
      const match = parsed.find((p) => p.bp === breakpointOrder[i])
      if (match) return match.pos as 'top' | 'bottom' | 'left' | 'right'
    }

    return 'bottom'
  }

  const calculatePosition = () => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current

    if (!trigger || !tooltip) return

    const triggerRect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()

    const preferredPosition = resolveResponsivePosition()
    const layout = computeTooltipLayout(triggerRect, tooltipRect, preferredPosition)

    setArrowOffset({ left: layout.arrowLeft, top: layout.arrowTop })

    setFinalPosition(layout.selected)
    setCoords({ top: layout.clampedTop, left: layout.clampedLeft })
    setHasCalculatedPosition(true)
  }

  useEffect(() => {
    const handleDismiss = (e: Event) => {
      if (
        isTouchDevice &&
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false)
        setIsMounted(false)
        setHasCalculatedPosition(false)
      }
    }

    const handleScrollOrTouchMove = () => {
      if (isTouchDevice) {
        setIsVisible(false)
        setIsMounted(false)
        setHasCalculatedPosition(false)
      }
    }

    if (isVisible) {
      calculatePosition()

      document.addEventListener('scroll', handleScrollOrTouchMove, { passive: true, capture: true })
      document.addEventListener('touchmove', handleScrollOrTouchMove, {
        passive: true,
        capture: true,
      })

      document.addEventListener('touchstart', handleDismiss, { passive: true })
      document.addEventListener('pointerdown', handleDismiss, { passive: true })

      window.addEventListener('resize', calculatePosition)
    }

    return () => {
      document.removeEventListener('scroll', handleScrollOrTouchMove, true)
      document.removeEventListener('touchmove', handleScrollOrTouchMove, true)
      document.removeEventListener('touchstart', handleDismiss)
      document.removeEventListener('pointerdown', handleDismiss)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [isVisible, position, breakpoint])

  useLayoutEffect(() => {
    if (isMounted && tooltipRef.current && triggerRef.current) {
      calculatePosition()
      setHasCalculatedPosition(true)
      setIsVisible(true)
    }
  }, [isMounted, position, breakpoint])

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${tooltipStyles ?? ''}`}
        onMouseEnter={() => {
          if (!disabled) {
            setIsMounted(true)
            setIsVisible(true)
          }
        }}
        onMouseLeave={() => {
          setIsVisible(false)
          setIsMounted(false)
          setHasCalculatedPosition(false)
        }}
        onClick={() => {
          if (!disabled && isTouchDevice) {
            const willBeVisible = !isVisible
            setIsVisible(willBeVisible)
            setIsMounted(willBeVisible)

            if (!willBeVisible) {
              setHasCalculatedPosition(false)
            }
          }
        }}
      >
        {children}
      </div>

      {isMounted &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] ${width} rounded-md bg-white p-3 shadow-xl transition-opacity duration-200`}
            style={{ top: coords.top, left: coords.left }}
            role="tooltip"
          >
            <div
              className="absolute z-50 h-3 w-3 rotate-45 bg-white"
              style={{
                ...(finalPosition === 'top' && { bottom: '-6px', left: `${arrowOffset.left}px` }),
                ...(finalPosition === 'bottom' && { top: '-6px', left: `${arrowOffset.left}px` }),
                ...(finalPosition === 'left' && { right: '-6px', top: `${arrowOffset.top}px` }),
                ...(finalPosition === 'right' && { left: '-6px', top: `${arrowOffset.top}px` }),
              }}
            />

            <p className="text-sm font-semibold text-yellow">{heading}</p>
            {content ? (
              <p className={`mt-2 text-xs font-light text-black ${contentStyles ?? ''}`}>
                {content}
              </p>
            ) : null}
            {customContent}
          </div>,
          document.body,
        )}
    </>
  )
}
