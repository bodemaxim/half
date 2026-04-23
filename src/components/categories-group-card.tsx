import type { ReactNode } from 'react'
import { MdiIcon, type MdiIconName } from './mdi-icon'

type CategoriesGroupCardConfig = {
  'header-bg-color': string
  'header-icon': MdiIconName
  'body-bg-color': string
}

type CategoriesGroupCardProps = {
  config: CategoriesGroupCardConfig
  headerSlot: ReactNode
  bodySlot: ReactNode
}

export const CategoriesGroupCard = ({
  config,
  headerSlot,
  bodySlot,
}: CategoriesGroupCardProps) => {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl shadow-sm">
      <header
        className="flex items-center justify-between gap-3 px-4 py-3 text-white"
        style={{ backgroundColor: config['header-bg-color'] }}
      >
        <div className="min-w-0 flex-1">{headerSlot}</div>
        <MdiIcon name={config['header-icon']} size={1.2} color="currentColor" />
      </header>

      <div
        className="flex-1 px-4 py-4"
        style={{ backgroundColor: config['body-bg-color'] }}
      >
        {bodySlot}
      </div>
    </section>
  )
}

export type { CategoriesGroupCardConfig, CategoriesGroupCardProps }
