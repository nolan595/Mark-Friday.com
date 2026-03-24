'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Task, Priority, Workload } from '@/types'

interface TaskEditPanelProps {
  task: Task | null
  onClose: () => void
  onSave: (id: string, patch: Partial<Task>) => void
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

export default function TaskEditPanel({ task, onClose, onSave }: TaskEditPanelProps) {
  const [localTask, setLocalTask] = useState<Task | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const savedIndicatorRef = useRef<HTMLSpanElement>(null)
  const isOpen = task !== null

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setLocalTask(task)
    }
  }, [task])

  // Clear pending debounce on unmount to prevent stale saves after component is gone
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const panel = panelRef.current
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    first?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
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
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const triggerSave = useCallback(
    (patch: Partial<Task>) => {
      if (!localTask) return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSave(localTask.id, patch)
        setShowSaved(false)
        // Re-trigger animation
        requestAnimationFrame(() => {
          setShowSaved(true)
          setTimeout(() => setShowSaved(false), 1600)
        })
      }, 500)
    },
    [localTask, onSave],
  )

  const handleFieldChange = useCallback(
    <K extends keyof Task>(field: K, value: Task[K]) => {
      if (!localTask) return
      const updated = { ...localTask, [field]: value }
      setLocalTask(updated)
      triggerSave({ [field]: value } as Partial<Task>)
    },
    [localTask, triggerSave],
  )

  if (!localTask) return null

  return (
    <>
      {/* Overlay — click to close */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-overlay transition-opacity duration-250',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="complementary"
        aria-label="Edit task"
        className={cn(
          'fixed z-40 bg-surface border-border',
          // Desktop: right side panel
          'md:top-0 md:right-0 md:bottom-0 md:w-[380px] md:border-l',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 md:left-auto rounded-t-2xl md:rounded-none',
          'flex flex-col max-h-[90vh] md:max-h-screen overflow-y-auto',
          isOpen ? 'panel-enter' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-syne font-semibold text-base text-text-primary">
            Edit task
          </h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
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

        {/* Fields */}
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-[0.75rem] font-medium tracking-[0.04em] uppercase text-text-muted font-inter mb-2">
              Title
            </label>
            <textarea
              id="edit-title"
              value={localTask.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              rows={2}
              className={cn(
                'w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5',
                'text-sm text-text-primary font-inter resize-none',
                'placeholder:text-text-muted',
                'focus:outline-none focus:border-accent',
                'transition-colors duration-200',
              )}
              placeholder="Task title"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[0.75rem] font-medium tracking-[0.04em] uppercase text-text-muted font-inter mb-2">
              Priority
            </label>
            <div className="flex gap-2 flex-wrap">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFieldChange('priority', opt.value)}
                  className={cn(
                    'flex-1 min-w-[3rem] h-8 rounded-full border text-xs font-medium font-inter',
                    'transition-all duration-200',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    localTask.priority === opt.value
                      ? opt.colour
                      : 'text-text-muted border-border hover:bg-surface-raised',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label htmlFor="edit-due-date" className="block text-[0.75rem] font-medium tracking-[0.04em] uppercase text-text-muted font-inter mb-2">
              Due date
            </label>
            <input
              id="edit-due-date"
              type="date"
              value={localTask.dueDate ? localTask.dueDate.split('T')[0] : ''}
              onChange={(e) =>
                handleFieldChange('dueDate', e.target.value || null)
              }
              className={cn(
                'w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5',
                'text-sm text-text-primary font-inter',
                'focus:outline-none focus:border-accent',
                'transition-colors duration-200',
              )}
            />
          </div>

          {/* Workload */}
          <div>
            <label className="block text-[0.75rem] font-medium tracking-[0.04em] uppercase text-text-muted font-inter mb-2">
              Workload
            </label>
            <div className="flex gap-2 flex-wrap">
              {workloadOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFieldChange('workload', opt.value)}
                  className={cn(
                    'flex-1 min-w-[3rem] h-8 rounded-full border text-xs font-medium font-inter',
                    'transition-all duration-200',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    localTask.workload === opt.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'text-text-muted border-border hover:bg-surface-raised',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="edit-note" className="block text-[0.75rem] font-medium tracking-[0.04em] uppercase text-text-muted font-inter mb-2">
              Note
            </label>
            <textarea
              id="edit-note"
              value={localTask.note ?? ''}
              onChange={(e) =>
                handleFieldChange('note', e.target.value || null)
              }
              rows={3}
              className={cn(
                'w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5',
                'text-sm text-text-primary font-inter',
                'placeholder:text-text-muted',
                'focus:outline-none focus:border-accent',
                'transition-colors duration-200',
              )}
              placeholder="Add a note…"
            />
          </div>
        </div>

        {/* Saved indicator */}
        <div className="px-6 pb-4 flex-shrink-0 h-6 flex items-center">
          {showSaved && (
            <span
              ref={savedIndicatorRef}
              className="saved-indicator text-[0.6875rem] font-inter text-completed"
            >
              Saved ✓
            </span>
          )}
        </div>
      </div>
    </>
  )
}
