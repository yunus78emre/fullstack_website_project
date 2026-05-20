'use client'

import { useMemo } from 'react'
import { getCategoryColorProps, resolveCategoryColor } from '@/lib/category-colors'
import { cn } from '@/lib/utils'

type Variant = 'dot' | 'solid'

interface CategoryLabelProps {
  name: string
  /** Preferred: hex color (#RRGGBB) coming from the backend category row. */
  color?: string | null
  className?: string
  variant?: Variant
}

export { resolveCategoryColor }

export function CategoryLabel({ name, color, className, variant = 'dot' }: CategoryLabelProps) {
  const { className: colorClass, style } = useMemo(
    () => getCategoryColorProps({ color, name }),
    [color, name],
  )

  if (variant === 'solid') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white shadow-sm',
          colorClass,
          className,
        )}
        style={style}
      >
        {name}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border/40', colorClass)}
        style={style}
        aria-hidden
      />
      <span className="text-xs font-medium text-foreground">{name}</span>
    </span>
  )
}
