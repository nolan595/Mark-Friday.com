import { cn } from '@/lib/utils'
import type { Priority } from '@/types'

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const colourMap: Record<Exclude<Priority, 'NONE'>, string> = {
  HIGH: 'bg-priority-high/15 text-priority-high',
  MEDIUM: 'bg-priority-med/15 text-priority-med',
  LOW: 'bg-priority-low/15 text-priority-low',
}

const labelMap: Record<Exclude<Priority, 'NONE'>, string> = {
  HIGH: 'HIGH',
  MEDIUM: 'MED',
  LOW: 'LOW',
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (priority === 'NONE') return null

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full h-[22px] px-2',
        'text-[0.75rem] font-medium tracking-[0.04em] uppercase leading-none',
        'font-inter whitespace-nowrap',
        colourMap[priority],
        className,
      )}
    >
      {labelMap[priority]}
    </span>
  )
}
