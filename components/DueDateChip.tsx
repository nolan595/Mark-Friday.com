import { parseISO, isToday } from 'date-fns'
import { cn, formatDueDate, isOverdue } from '@/lib/utils'

interface DueDateChipProps {
  dueDate: string | null
  className?: string
}

export default function DueDateChip({ dueDate, className }: DueDateChipProps) {
  if (!dueDate) return null

  const formatted = formatDueDate(dueDate)
  if (!formatted) return null

  const date = parseISO(dueDate)
  const today = isToday(date)
  const overdue = isOverdue(dueDate)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full h-[22px] px-2',
        'text-[0.75rem] leading-none font-inter whitespace-nowrap',
        {
          'text-text-muted bg-transparent': !today && !overdue,
          'text-priority-med bg-priority-med/10 font-medium': today,
          'text-priority-high bg-priority-high/10 font-bold': overdue,
        },
        className,
      )}
    >
      {formatted}
    </span>
  )
}
