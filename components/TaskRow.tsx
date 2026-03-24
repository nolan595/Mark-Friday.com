'use client'

import { useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import PriorityBadge from './PriorityBadge'
import DueDateChip from './DueDateChip'
import WorkloadChip from './WorkloadChip'

interface TaskRowProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

export default function TaskRow({ task, onComplete, onDelete, onEdit }: TaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false)

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

  return (
    <li
      ref={setNodeRef}
      style={style}
      role="listitem"
      className={cn(
        'group relative flex items-center gap-3 h-14 px-4',
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
          'flex-shrink-0 flex items-center justify-center w-4 h-4',
          'text-text-muted cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'hidden md:flex',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        {/* Grip vertical dots */}
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
      <div className="relative flex-shrink-0">
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
              {/* Checkmark SVG */}
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
              {/* Ripple ring */}
              <span
                aria-hidden="true"
                className="checkbox-ripple absolute inset-0 rounded-full border-2 border-completed"
              />
            </>
          )}
        </button>
      </div>

      {/* Title — click to edit */}
      <button
        onClick={() => onEdit(task)}
        className={cn(
          'flex-1 text-left text-sm text-text-primary font-inter truncate',
          'hover:text-white transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
          'min-w-0',
        )}
      >
        {task.title}
      </button>

      {/* Right-side chips and actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <PriorityBadge priority={task.priority} />
        <DueDateChip dueDate={task.dueDate} />
        <WorkloadChip workload={task.workload} />

        {/* Note icon */}
        {task.note && (
          <button
            onClick={() => onEdit(task)}
            aria-label="View note"
            className={cn(
              'flex items-center justify-center w-5 h-5 text-text-muted',
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

        {/* Delete button */}
        <button
          onClick={handleDelete}
          aria-label="Delete task"
          className={cn(
            'flex items-center justify-center w-5 h-5',
            'text-text-muted hover:text-danger transition-colors duration-200',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
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
