import Icon from '@mdi/react'
import * as mdiIcons from '@mdi/js'
import { createElement, type ComponentProps } from 'react'

export type MdiIconName = keyof typeof mdiIcons

type MdiIconProps = {
  name: MdiIconName
  size?: ComponentProps<typeof Icon>['size']
  color?: ComponentProps<typeof Icon>['color']
}

export const MdiIcon = ({ name, size = 1, color }: MdiIconProps) => {
  const path = mdiIcons[name]

  if (typeof path !== 'string') {
    return null
  }

  return createElement(Icon, {
    path,
    size,
    color,
  })
}

export type { MdiIconProps }
