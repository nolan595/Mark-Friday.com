'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Priority, Workload } from '@/types'
import PriorityBadge from './PriorityBadge'
import DueDateChip from './DueDateChip'
import WorkloadChip from './WorkloadChip'
import CellPopover, { type PopoverOption } from './CellPopover'
import { COLUMN_WIDTHS } from './ColumnHeader'

// ─── Popover option sets ───────────────────────────────────────────────────────

const PRIORITY_OPTIONS: PopoverOption[] = [
  { value: 'NONE', label: 'None', dotColor: '', className: 'text-text-muted' },
  { value: 'HIGH', label: 'High', dotColor: '#FF6B6B' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#FFB347' },
  { value: 'LOW', label: 'Low', dotColor: '#4ECDC4' },
]

const WORKLOAD_OPTIONS: PopoverOption[] = [
  { value: 'NONE', label: 'None', className: 'text-text-muted' },
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HEAVY', label: 'Heavy' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickAddRowProps {
  onAdd: (payload: {
    title: string
    priority: Priority
    dueDate: string | null
    workload: Workload
  }) => void
}

// ─── Date popover dismiss helper ──────────────────────────────────────────────

function DatePopoverDismiss({
  onClose,
  triggerRef,
}: {
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}) {
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const insideDialog = (target as Element).closest?.('[role="dialog"]')
      const insideTrigger = triggerRef.current?.contains(target)
      if (!insideDialog && !insideTrigger) onClose()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, triggerRef])

  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuickAddRow({ onAdd }: QuickAddRowProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('NONE')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [workload, setWorkload] = useState<Workload>('NONE')
  const [isFocused, setIsFocused] = useState(false)
  const [openPopover, setOpenPopover] = useState<'priority' | 'dueDate' | 'workload' | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const priorityTriggerRef = useRef<HTMLButtonElement>(null)
  const dateTriggerRef = useRef<HTMLButtonElement>(null)
  const workloadTriggerRef = useRef<HTMLButtonElement>(null)

  const reset = useCallback(() => {
    setTitle('')
    setPriority('NONE')
    setDueDate(null)
    setWorkload('NONE')
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd({ title: trimmed, priority, dueDate, workload })
    reset()
    inputRef.current?.focus()
  }, [title, priority, dueDate, workload, onAdd, reset])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handlePriorityChange = useCallback((value: string) => {
    setPriority(value as Priority)
  }, [])

  const handleWorkloadChange = useCallback((value: string) => {
    setWorkload(value as Workload)
  }, [])

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value || null)
    setOpenPopover(null)
  }, [])

  const handleDateClear = useCallback(() => {
    setDueDate(null)
    setOpenPopover(null)
  }, [])

  const togglePopover = useCallback(
    (name: 'priority' | 'dueDate' | 'workload') => {
      setOpenPopover((prev) => (prev === name ? null : name))
    },
    [],
  )

  const closePopover = useCallback(() => setOpenPopover(null), [])

  return (
    <form
      role="form"
      aria-label="Add a new task"
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className={cn(
        'flex items-center h-12 bg-surface transition-colors duration-150',
        isFocused ? 'border-b-2 border-accent' : 'border-b border-border',
      )}
    >
      {/* Drag handle spacer */}
      <div
        className={cn(COLUMN_WIDTHS.handle, 'flex-shrink-0 hidden md:block')}
        aria-hidden="true"
      />

      {/* Plus icon — acts as submit trigger */}
      <div className={cn(COLUMN_WIDTHS.checkbox, 'flex-shrink-0 flex items-center justify-center')}>
        <button
          type="submit"
          aria-label="Add task"
          className={cn(
            'flex items-center justify-center w-5 h-5 rounded-full',
            'text-text-muted hover:text-accent transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* NAME column */}
      <div className={cn(COLUMN_WIDTHS.name, 'min-w-0')}>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Task name"
          placeholder="Add a task…"
          className={cn(
            'w-full h-full bg-transparent',
            'text-sm text-text-primary font-inter',
            'placeholder:text-text-muted',
            'outline-none border-none',
            'focus:placeholder:opacity-0 transition-colors duration-200',
          )}
        />
      </div>

      {/* PRIORITY column */}
      <div
        className={cn(
          COLUMN_WIDTHS.priority,
          'flex-shrink-0 hidden md:flex items-center pl-2 relative',
        )}
      >
        <button
          ref={priorityTriggerRef}
          type="button"
          onClick={() => togglePopover('priority')}
          aria-label="Set priority"
          aria-haspopup="listbox"
          aria-expanded={openPopover === 'priority'}
          className={cn(
            'rounded-md px-1.5 py-1 -ml-1.5',
            'hover:bg-surface-raised transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {priority === 'NONE' ? (
            <span className="text-sm text-text-muted font-inter">Priority</span>
          ) : (
            <PriorityBadge priority={priority} />
          )}
        </button>

        <CellPopover
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={handlePriorityChange}
          onClose={closePopover}
          isOpen={openPopover === 'priority'}
          role="listbox"
          triggerRef={priorityTriggerRef}
        />
      </div>

      {/* DUE DATE column */}
      <div
        className={cn(
          COLUMN_WIDTHS.dueDate,
          'flex-shrink-0 hidden md:flex items-center pl-2 relative',
        )}
      >
        <button
          ref={dateTriggerRef}
          type="button"
          onClick={() => togglePopover('dueDate')}
          aria-label="Set due date"
          aria-haspopup="dialog"
          aria-expanded={openPopover === 'dueDate'}
          className={cn(
            'rounded-md px-1.5 py-1 -ml-1.5',
            'hover:bg-surface-raised transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {dueDate ? (
            <DueDateChip dueDate={dueDate} />
          ) : (
            <span className="text-sm text-text-muted font-inter">Date</span>
          )}
        </button>

        {openPopover === 'dueDate' && (
          <>
            <DatePopoverDismiss onClose={closePopover} triggerRef={dateTriggerRef} />
            <div
              role="dialog"
              aria-label="Set due date"
              className="absolute z-30 top-full left-0 mt-1 bg-surface-raised border border-border rounded-lg p-3 cell-popover min-w-[180px]"
            >
              <input
                ref={dateInputRef}
                type="date"
                defaultValue={dueDate ?? ''}
                onChange={handleDateChange}
                autoFocus
                className={cn(
                  'block w-full h-9 px-3 rounded-lg',
                  'bg-surface border border-border',
                  'text-sm text-text-primary font-inter',
                  'focus:border-accent focus-visible:outline-none',
                  'transition-colors duration-150',
                )}
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={handleDateClear}
                  className={cn(
                    'mt-2 w-full text-left text-sm font-inter text-text-muted px-1',
                    'hover:text-text-primary transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
                  )}
                >
                  Clear date
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* WORKLOAD column */}
      <div
        className={cn(
          COLUMN_WIDTHS.workload,
          'flex-shrink-0 hidden md:flex items-center pl-2 relative',
        )}
      >
        <button
          ref={workloadTriggerRef}
          type="button"
          onClick={() => togglePopover('workload')}
          aria-label="Set workload"
          aria-haspopup="listbox"
          aria-expanded={openPopover === 'workload'}
          className={cn(
            'rounded-md px-1.5 py-1 -ml-1.5',
            'hover:bg-surface-raised transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {workload === 'NONE' ? (
            <span className="text-sm text-text-muted font-inter">Workload</span>
          ) : (
            <WorkloadChip workload={workload} />
          )}
        </button>

        <CellPopover
          options={WORKLOAD_OPTIONS}
          value={workload}
          onChange={handleWorkloadChange}
          onClose={closePopover}
          isOpen={openPopover === 'workload'}
          role="listbox"
          triggerRef={workloadTriggerRef}
        />
      </div>

      {/* Actions spacer */}
      <div
        className={cn(COLUMN_WIDTHS.actions, 'flex-shrink-0')}
        aria-hidden="true"
      />
    </form>
  )
}
