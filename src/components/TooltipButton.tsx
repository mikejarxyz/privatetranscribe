import { type ReactNode, useId, useState } from 'react'

type TooltipButtonProps = {
  ariaLabel: string
  buttonClassName: string
  children: ReactNode
  tooltip: ReactNode
  tooltipClassName: string
}

export function TooltipButton({
  ariaLabel,
  buttonClassName,
  children,
  tooltip,
  tooltipClassName,
}: TooltipButtonProps) {
  const tooltipId = useId()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={buttonClassName}
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.parentElement?.contains(event.relatedTarget)
          ) {
            return
          }

          setIsOpen(false)
        }}
        onClick={() => setIsOpen((open) => !open)}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') {
            setIsOpen(true)
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            setIsOpen(false)
          }
        }}
        type="button"
      >
        {children}
      </button>
      {isOpen ? (
        <div className={tooltipClassName} id={tooltipId} role="tooltip">
          {tooltip}
        </div>
      ) : null}
    </div>
  )
}
