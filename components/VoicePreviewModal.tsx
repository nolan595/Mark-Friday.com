'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ParsedTask, Priority, Workload } from '@/types'

interface VoicePreviewModalProps {
  tasks: ParsedTask[]
  onConfirm: (tasks: ParsedTask[]) => void
  onCancel: () => void
}

const priorityOptions: { value: Priority; label: string; colour: string }[] = [
  { value: 'HIGH', label: 'High', colour: 'text-priority-high border-priority-high bg-priority-high/10' },
  { value: 'MEDIUM', label: 'Med', colour: 'text-priority-med border-priority-med bg-priority-med/10' },
  { value: 'LOW', label: 'Low', colour: 'text-priority-low border-priority-low bg-priority-low/10' },
  { value: 'NONE', label: 'None', colour: 'text-text-muted border-border' },
]

const workloadOptions: { value: Workload; label: string }[] = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HEAVY', label: 'Heavy' },
  { value: 'NONE', label: 'None' },
]

export default function VoicePreviewModal({
  tasks,
  onConfirm,
  onCancel,
}: VoicePreviewModalProps) {
  const [editableTasks, setEditableTasks] = useState<ParsedTask[]>(tasks)
  const [isSaving, setIsSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const headingId = 'voice-preview-heading'

  // Sync if tasks prop changes
  useEffect(() => {
    setEditableTasks(tasks)
  }, [tasks])

  // Focus trap + escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Focus first input on open
    requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>('input, textarea')
      first?.focus()
    })

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const updateTask = useCallback(
    (index: number, patch: Partial<ParsedTask>) => {
      setEditableTasks((prev) =>
        prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
      )
    },
    [],
  )

  const removeTask = useCallback((index: number) => {
    setEditableTasks((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleConfirm = useCallback(async () => {
    setIsSaving(true)
    try {
      await onConfirm(editableTasks)
    } finally {
      setIsSaving(false)
    }
  }, [editableTasks, onConfirm])

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="fixed inset-0 z-50 bg-black/70 animate-[fade-in_200ms_ease-out_forwards]"
        style={{ animation: 'fade-in 200ms ease-out forwards' }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-surface rounded-t-2xl',
          'max-h-[80vh] flex flex-col',
          'modal-enter',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2
              id={headingId}
              className="font-syne font-bold text-lg text-text-primary"
            >
              Review tasks
            </h2>
            <p className="text-[0.75rem] text-text-muted font-inter mt-0.5">
              {editableTasks.length} task{editableTasks.length !== 1 ? 's' : ''} parsed from your voice
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel and close"
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              'text-text-muted hover:text-text-primary hover:bg-surface-raised',
              'transition-all duration-200',
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Task cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {editableTasks.map((task, index) => (
            <TaskPreviewCard
              key={index}
              task={task}
              index={index}
              onUpdate={(patch) => updateTask(index, patch)}
              onRemove={() => removeTask(index)}
              disabled={isSaving}
            />
          ))}

          {editableTasks.length === 0 && (
            <p className="text-sm text-text-muted font-inter text-center py-8">
              All tasks removed. Cancel or add tasks manually.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={isSaving || editableTasks.length === 0}
            className={cn(
              'flex-1 h-10 rounded-full bg-accent text-white',
              'text-sm font-medium font-inter',
              'transition-all duration-200 hover:brightness-110',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100',
              'flex items-center justify-center gap-2',
            )}
          >
            {isSaving && (
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
                className="animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            Add {editableTasks.length} task{editableTasks.length !== 1 ? 's' : ''}
          </button>

          <button
            onClick={onCancel}
            disabled={isSaving}
            className={cn(
              'px-5 h-10 rounded-full',
              'text-sm font-medium font-inter text-text-muted',
              'hover:text-text-primary transition-colors duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

interface TaskPreviewCardProps {
  task: ParsedTask
  index: number
  onUpdate: (patch: Partial<ParsedTask>) => void
  onRemove: () => void
  disabled: boolean
}

function TaskPreviewCard({
  task,
  index,
  onUpdate,
  onRemove,
  disabled,
}: TaskPreviewCardProps) {
  return (
    <div
      className="task-card bg-surface-raised rounded-lg p-4 relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove task"
        className={cn(
          'absolute top-3 right-3',
          'flex items-center justify-center w-6 h-6 rounded',
          'text-text-muted hover:text-danger transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="space-y-3 pr-8">
        {/* Title */}
        <input
          type="text"
          aria-label={`Task ${index + 1} title`}
          value={task.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          disabled={disabled}
          placeholder="Task title"
          className={cn(
            'w-full bg-surface border border-border rounded-lg px-3 py-2',
            'text-sm text-text-primary font-inter',
            'placeholder:text-text-muted',
            'focus:outline-none focus:border-accent',
            'transition-colors duration-200',
            'disabled:opacity-50',
          )}
        />

        {/* Priority */}
        <div className="flex gap-1.5">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ priority: opt.value })}
              disabled={disabled}
              className={cn(
                'flex-1 h-7 rounded-full border text-[0.6875rem] font-medium font-inter',
                'transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                'disabled:opacity-50',
                task.priority === opt.value
                  ? opt.colour
                  : 'text-text-muted border-border hover:bg-surface',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Due date */}
        <input
          type="date"
          value={task.dueDate ?? ''}
          onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
          disabled={disabled}
          className={cn(
            'w-full bg-surface border border-border rounded-lg px-3 py-2',
            'text-sm text-text-primary font-inter',
            'focus:outline-none focus:border-accent',
            'transition-colors duration-200',
            'disabled:opacity-50',
          )}
        />

        {/* Workload */}
        <div className="flex gap-1.5">
          {workloadOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ workload: opt.value })}
              disabled={disabled}
              className={cn(
                'flex-1 h-7 rounded-full border text-[0.6875rem] font-medium font-inter',
                'transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                'disabled:opacity-50',
                task.workload === opt.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'text-text-muted border-border hover:bg-surface',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
