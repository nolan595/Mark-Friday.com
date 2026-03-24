import { cn } from '@/lib/utils'
import type { Workload } from '@/types'

interface WorkloadChipProps {
  workload: Workload
  className?: string
}

const labelMap: Record<Exclude<Workload, 'NONE'>, string> = {
  LIGHT: 'Light',
  MEDIUM: 'Medium',
  HEAVY: 'Heavy',
}

export default function WorkloadChip({ workload, className }: WorkloadChipProps) {
  if (workload === 'NONE') return null

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full h-[22px] px-2',
        'text-[0.75rem] leading-none text-text-muted font-inter whitespace-nowrap',
        'bg-surface-raised',
        className,
      )}
    >
      {labelMap[workload]}
    </span>
  )
}
