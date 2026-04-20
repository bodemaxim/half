import { Tooltip } from 'primereact/tooltip'
import { type ReactNode, useMemo } from 'react'

type InfoWidgetProps = {
  tooltip: ReactNode
  children: ReactNode
  className?: string
  iconClassName?: string
  tooltipClassName?: string
}

export const InfoWidget = ({
  tooltip,
  children,
  className,
  iconClassName,
  tooltipClassName,
}: InfoWidgetProps) => {
  const tooltipTargetClass = useMemo(
    () => `info-widget-target-${Math.random().toString(36).slice(2, 11)}`,
    [],
  )

  return (
    <div className={`relative ${className ?? ''}`}>
      {children}

      <Tooltip target={`.${tooltipTargetClass}`} className={tooltipClassName}>
        {tooltip}
      </Tooltip>

      <div className="absolute top-0 right-0 z-10">
        <button
          type="button"
          aria-label="Показать подсказку"
          data-pr-position="bottom"
          className={`${tooltipTargetClass} flex h-6 w-6 items-center justify-center rounded-full border border-surface-300 bg-white/90 text-xs font-bold text-surface-700 shadow-sm transition-colors hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-blue-400 ${iconClassName ?? ''}`}
        >
          ?
        </button>
      </div>
    </div>
  )
}
