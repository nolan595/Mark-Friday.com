'use client'

import { cn } from '@/lib/utils'

export type FilterType = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'DUE_TODAY'

interface FilterBarProps {
  active: FilterType
  onChange: (f: FilterType) => void
}

const filters: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
  { label: 'Due Today', value: 'DUE_TODAY' },
]

export default function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filter tasks"
      className="border-b border-border bg-background"
    >
      <div className="max-w-[900px] mx-auto px-6 md:px-10">
        <div className="filter-scroll flex items-center gap-2 h-12">
          {filters.map((filter) => {
            const isActive = active === filter.value
            return (
              <button
                key={filter.value}
                onClick={() => onChange(filter.value)}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex items-center justify-center rounded-full h-[30px] px-4',
                  'text-[0.75rem] font-medium tracking-[0.04em] uppercase',
                  'font-inter whitespace-nowrap transition-all duration-200 ease-out',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-muted border border-border hover:bg-surface-raised',
                )}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
