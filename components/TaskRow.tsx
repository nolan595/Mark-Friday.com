'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { Task, Priority, Workload } from '@/types'
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

interface TaskRowProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onUpdate: (patch: Partial<Task>) => void
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

export default function TaskRow({ task, onComplete, onDelete, onEdit, onUpdate }: TaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [openPopover, setOpenPopover] = useState<'priority' | 'dueDate' | 'workload' | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const priorityTriggerRef = useRef<HTMLButtonElement>(null)
  const dateTriggerRef = useRef<HTMLButtonElement>(null)
  const workloadTriggerRef = useRef<HTMLButtonElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleComplete = useCallback(() => {
    if (isCompleting) return
    setIsCompleting(true)
    setTimeout(() => {
      onComplete(task.id)
    }, 400)
  }, [isCompleting, onComplete, task.id])

  const handleDelete = useCallback(() => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task.id)
    }
  }, [onDelete, task.id, task.title])

  const handlePriorityChange = useCallback(
    (value: string) => {
      onUpdate({ priority: value as Priority })
    },
    [onUpdate],
  )

  const handleWorkloadChange = useCallback(
    (value: string) => {
      onUpdate({ workload: value as Workload })
    },
    [onUpdate],
  )

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ dueDate: e.target.value || null })
      setOpenPopover(null)
    },
    [onUpdate],
  )

  const handleDateClear = useCallback(() => {
    onUpdate({ dueDate: null })
    setOpenPopover(null)
  }, [onUpdate])

  const togglePopover = useCallback(
    (name: 'priority' | 'dueDate' | 'workload') => {
      setOpenPopover((prev) => (prev === name ? null : name))
    },
    [],
  )

  const closePopover = useCallback(() => setOpenPopover(null), [])

  return (
    <li
      ref={setNodeRef}
      style={style}
      role="listitem"
      className={cn(
        'group relative flex items-center h-12',
        'border-b border-border transition-all duration-200 ease-out',
        isDragging
          ? 'bg-drag-active border border-accent/40 opacity-80 z-10'
          : 'bg-surface hover:bg-surface-raised',
        isCompleting && 'task-row-completing',
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        tabIndex={-1}
        className={cn(
          COLUMN_WIDTHS.handle,
          'flex-shrink-0 flex items-center justify-center h-full',
          'text-text-muted cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'hidden md:flex',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <svg
          width="10"
          height="16"
          viewBox="0 0 10 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="3" cy="13" r="1.5" />
          <circle cx="7" cy="3" r="1.5" />
          <circle cx="7" cy="8" r="1.5" />
          <circle cx="7" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Checkbox */}
      <div className={cn(COLUMN_WIDTHS.checkbox, 'flex-shrink-0 flex items-center justify-center')}>
        <div className="relative">
          <button
            role="checkbox"
            aria-checked={isCompleting}
            aria-label={`Complete task: ${task.title}`}
            onClick={handleComplete}
            disabled={isCompleting}
            className={cn(
              'relative flex items-center justify-center w-5 h-5 rounded-full',
              'border-2 transition-all duration-300',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              isCompleting
                ? 'border-completed bg-completed'
                : 'border-border hover:border-accent',
            )}
          >
            {isCompleting && (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6 L5 9 L10 3"
                    className="checkbox-checkmark"
                    strokeDasharray="24"
                    strokeDashoffset="24"
                  />
                </svg>
                <span
                  aria-hidden="true"
                  className="checkbox-ripple absolute inset-0 rounded-full border-2 border-completed"
                />
              </>
            )}
          </button>
        </div>
      </div>

      {/* NAME column */}
      <div className={cn(COLUMN_WIDTHS.name, 'min-w-0 flex flex-col justify-center')}>
        <button
          onClick={() => onEdit(task)}
          className={cn(
            'text-left text-sm text-text-primary font-inter truncate',
            'hover:text-white transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
          )}
        >
          {task.title}
        </button>

        {/* Mobile chip row — hidden on md+ */}
        {(task.priority !== 'NONE' || task.dueDate || task.workload !== 'NONE') && (
          <div className="md:hidden flex items-center gap-1 mt-0.5 flex-wrap">
            {task.priority !== 'NONE' && <PriorityBadge priority={task.priority} />}
            {task.dueDate && <DueDateChip dueDate={task.dueDate} />}
            {task.workload !== 'NONE' && <WorkloadChip workload={task.workload} />}
          </div>
        )}
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
          onClick={() => togglePopover('priority')}
          aria-label="Set priority"
          aria-haspopup="listbox"
          aria-expanded={openPopover === 'priority'}
          className={cn(
            'rounded-md px-1.5 py-1 -ml-1.5',
            'hover:bg-surface-raised transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {task.priority === 'NONE' ? (
            <span className="text-sm text-text-muted font-inter">—</span>
          ) : (
            <PriorityBadge priority={task.priority} />
          )}
        </button>

        <CellPopover
          options={PRIORITY_OPTIONS}
          value={task.priority}
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
          onClick={() => togglePopover('dueDate')}
          aria-label="Set due date"
          aria-haspopup="dialog"
          aria-expanded={openPopover === 'dueDate'}
          className={cn(
            'rounded-md px-1.5 py-1 -ml-1.5',
            'hover:bg-surface-raised transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {task.dueDate ? (
            <DueDateChip dueDate={task.dueDate} />
          ) : (
            <span className="text-sm text-text-muted font-inter">—</span>
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
                defaultValue={task.dueDate ?? ''}
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
              {task.dueDate && (
                <button
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
          onClick={() => togglePopover('workload')}
          aria-label="Set workload"
          aria-haspopup="listbox"
          aria-expanded={openPopover === 'workload'}
          className={cn(
            'rounded-md px-1.5 py-1 -ml-1.5',
            'hover:bg-surface-raised transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {task.workload === 'NONE' ? (
            <span className="text-sm text-text-muted font-inter">—</span>
          ) : (
            <WorkloadChip workload={task.workload} />
          )}
        </button>

        <CellPopover
          options={WORKLOAD_OPTIONS}
          value={task.workload}
          onChange={handleWorkloadChange}
          onClose={closePopover}
          isOpen={openPopover === 'workload'}
          role="listbox"
          triggerRef={workloadTriggerRef}
        />
      </div>

      {/* Actions column */}
      <div
        className={cn(
          COLUMN_WIDTHS.actions,
          'flex-shrink-0 flex items-center justify-end gap-1 pr-2',
        )}
      >
        {task.note && (
          <button
            onClick={() => onEdit(task)}
            aria-label="View note"
            className={cn(
              'flex items-center justify-center w-6 h-6 text-text-muted',
              'hover:text-text-primary transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
        )}

        <button
          onClick={handleDelete}
          aria-label="Delete task"
          className={cn(
            'flex items-center justify-center w-6 h-6',
            'text-text-muted hover:text-danger',
            'opacity-0 group-hover:opacity-100',
            'transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
          )}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </li>
  )
}
