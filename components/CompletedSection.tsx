'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import PriorityBadge from './PriorityBadge'
import DueDateChip from './DueDateChip'
import WorkloadChip from './WorkloadChip'

interface CompletedSectionProps {
  tasks: Task[]
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onClear: () => void
}

export default function CompletedSection({
  tasks,
  onUncomplete,
  onDelete,
  onClear,
}: CompletedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClear = useCallback(() => {
    if (window.confirm(`Clear all ${tasks.length} completed tasks? This cannot be undone.`)) {
      onClear()
    }
  }, [onClear, tasks.length])

  if (tasks.length === 0) return null

  return (
    <section className="mt-8" aria-label="Completed tasks">
      {/* Section header */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <button
          id="completed-section-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="completed-task-list"
          className={cn(
            'flex items-center gap-2 text-text-muted',
            'hover:text-text-primary transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
          )}
        >
          {/* Chevron */}
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
            className={cn(
              'transition-transform duration-300',
              isExpanded ? 'rotate-90' : 'rotate-0',
            )}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-[0.75rem] font-medium tracking-[0.04em] uppercase font-inter">
            Completed ({tasks.length})
          </span>
        </button>

        {/* Clear all */}
        <button
          onClick={handleClear}
          className={cn(
            'text-[0.75rem] font-inter text-text-muted',
            'hover:text-danger transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm',
          )}
        >
          Clear all
        </button>
      </div>

      {/* Collapsible list */}
      <div
        id="completed-task-list"
        role="list"
        className={cn('completed-list', isExpanded && 'expanded')}
        aria-label="Completed tasks list"
      >
        <div className="completed-list-inner">
          {tasks.map((task) => (
            <CompletedTaskRow
              key={task.id}
              task={task}
              onUncomplete={onUncomplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CompletedTaskRowProps {
  task: Task
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
}

function CompletedTaskRow({ task, onUncomplete, onDelete }: CompletedTaskRowProps) {
  const handleDelete = useCallback(() => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDelete(task.id)
    }
  }, [onDelete, task.id, task.title])

  return (
    <div
      role="listitem"
      className="group flex items-center gap-3 h-14 px-4 border-b border-border opacity-50 hover:opacity-70 transition-opacity duration-200"
    >
      {/* Filled green checkbox */}
      <button
        role="checkbox"
        aria-checked={true}
        aria-label={`Uncheck task: ${task.title}`}
        onClick={() => onUncomplete(task.id)}
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full',
          'bg-completed border-2 border-completed transition-all duration-200',
          'hover:opacity-80',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
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
          <path d="M2 6 L5 9 L10 3" />
        </svg>
      </button>

      {/* Title with strikethrough */}
      <span className="flex-1 text-sm text-text-muted font-inter line-through truncate min-w-0">
        {task.title}
      </span>

      {/* Greyed out chips */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-50">
        <PriorityBadge priority={task.priority} />
        <DueDateChip dueDate={task.dueDate} />
        <WorkloadChip workload={task.workload} />
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        aria-label="Delete completed task"
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-5 h-5',
          'text-text-muted hover:text-danger transition-colors duration-200',
          'opacity-0 group-hover:opacity-100',
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
  )
}
