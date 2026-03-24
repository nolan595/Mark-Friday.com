'use client'

import { cn } from '@/lib/utils'

// ─── Column width constants ────────────────────────────────────────────────────
// Single source of truth shared by TaskRow, QuickAddRow, and ColumnHeader.

export const COLUMN_WIDTHS = {
  handle: 'w-8',
  checkbox: 'w-10',
  name: 'flex-1 min-w-[200px]',
  priority: 'w-[120px]',
  dueDate: 'w-[130px]',
  workload: 'w-[120px]',
  actions: 'w-[72px]',
} as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColumnHeader() {
  return (
    <div
      role="row"
      aria-label="Task columns"
      className={cn(
        'flex items-center h-9 bg-surface',
        'sticky top-[120px] z-10',
      )}
    >
      {/* Drag handle spacer */}
      <div
        className={cn(COLUMN_WIDTHS.handle, 'flex-shrink-0 hidden md:block')}
        aria-hidden="true"
      />

      {/* Checkbox spacer */}
      <div
        className={cn(COLUMN_WIDTHS.checkbox, 'flex-shrink-0')}
        aria-hidden="true"
      />

      {/* NAME */}
      <div
        role="columnheader"
        className={cn(
          COLUMN_WIDTHS.name,
          'text-[11px] font-medium uppercase tracking-widest text-text-muted font-inter',
        )}
      >
        Name
      </div>

      {/* PRIORITY */}
      <div
        role="columnheader"
        className={cn(
          COLUMN_WIDTHS.priority,
          'flex-shrink-0 hidden md:block',
          'text-[11px] font-medium uppercase tracking-widest text-text-muted font-inter',
          'pl-2',
        )}
      >
        Priority
      </div>

      {/* DUE DATE */}
      <div
        role="columnheader"
        className={cn(
          COLUMN_WIDTHS.dueDate,
          'flex-shrink-0 hidden md:block',
          'text-[11px] font-medium uppercase tracking-widest text-text-muted font-inter',
          'pl-2',
        )}
      >
        Due Date
      </div>

      {/* WORKLOAD */}
      <div
        role="columnheader"
        className={cn(
          COLUMN_WIDTHS.workload,
          'flex-shrink-0 hidden md:block',
          'text-[11px] font-medium uppercase tracking-widest text-text-muted font-inter',
          'pl-2',
        )}
      >
        Workload
      </div>

      {/* Actions spacer */}
      <div
        className={cn(COLUMN_WIDTHS.actions, 'flex-shrink-0')}
        aria-hidden="true"
      />
    </div>
  )
}
