export type TooltipLayoutResult = {
  clampedLeft: number
  clampedTop: number
  arrowLeft: number
  arrowTop: number
  selected: 'top' | 'bottom' | 'left' | 'right'
}

const margin = 8

export function computeTooltipLayout(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right',
): TooltipLayoutResult {
  const positions = {
    top: {
      top: triggerRect.top - tooltipRect.height - margin,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    bottom: {
      top: triggerRect.bottom + margin,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    left: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.left - tooltipRect.width - margin,
    },
    right: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.right + margin,
    },
  }

  const fits = {
    top: positions.top.top > 0,
    bottom: positions.bottom.top + tooltipRect.height < window.innerHeight,
    left: positions.left.left > 0,
    right: positions.right.left + tooltipRect.width < window.innerWidth,
  }

  const preferredOrder: Array<'top' | 'bottom' | 'left' | 'right'> = [
    preferredPosition,
    'top',
    'bottom',
    'right',
    'left',
  ]
  const selected =
    preferredOrder.find((pos) => fits[pos as keyof typeof fits]) ?? ('bottom' as const)

  const chosenPosition = positions[selected]

  const clampedLeft = Math.min(
    Math.max(8, chosenPosition.left),
    window.innerWidth - tooltipRect.width - 8,
  )
  const clampedTop = Math.min(
    Math.max(8, chosenPosition.top),
    window.innerHeight - tooltipRect.height - 8,
  )

  const triggerCenterX = triggerRect.left + triggerRect.width / 2
  const triggerCenterY = triggerRect.top + triggerRect.height / 2

  const arrowLeft = triggerCenterX - clampedLeft - 6
  const arrowTop = triggerCenterY - clampedTop - 6

  return { clampedLeft, clampedTop, arrowLeft, arrowTop, selected }
}
