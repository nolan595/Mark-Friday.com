'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { Task, ParsedTask } from '@/types'
import type { FilterType } from './FilterBar'
import FilterBar from './FilterBar'
import TaskRow from './TaskRow'
import TaskEditPanel from './TaskEditPanel'
import CompletedSection from './CompletedSection'
import VoiceBrainDump from './VoiceBrainDump'
import VoicePreviewModal from './VoicePreviewModal'
import QuickAddRow from './QuickAddRow'
import EmptyState from './EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
  exiting: boolean
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 h-14 px-4 border-b border-border bg-surface animate-pulse">
      <div className="w-4 h-4 rounded bg-surface-raised hidden md:block" />
      <div className="w-5 h-5 rounded-full bg-surface-raised flex-shrink-0" />
      <div className="flex-1 h-3 rounded-full bg-surface-raised max-w-[60%]" />
      <div className="w-10 h-[22px] rounded-full bg-surface-raised" />
      <div className="w-14 h-[22px] rounded-full bg-surface-raised" />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskBoard() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [previewTasks, setPreviewTasks] = useState<ParsedTask[] | null>(null)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const voiceRef = useRef<HTMLButtonElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // ─── Toast ───────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type, exiting: false }])
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 200)
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 200)
  }, [])

  // ─── Fetch ───────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks')
        if (!res.ok) throw new Error('Failed to fetch tasks')
        const data = await res.json()
        setActiveTasks(data.active ?? [])
        setCompletedTasks(data.completed ?? [])
      } catch {
        showToast('Failed to load tasks', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTasks()
  }, [showToast])

  // ─── CRUD ────────────────────────────────────────────────────────────────

  const createTask = useCallback(
    async (title: string) => {
      const tempId = `temp-${Date.now()}`
      const optimistic: Task = {
        id: tempId,
        title,
        priority: 'NONE',
        dueDate: null,
        workload: 'NONE',
        note: null,
        status: 'ACTIVE',
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setActiveTasks((prev) => [optimistic, ...prev])

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create task')
        }
        const created: Task = await res.json()
        setActiveTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)))
      } catch (err) {
        setActiveTasks((prev) => prev.filter((t) => t.id !== tempId))
        showToast(err instanceof Error ? err.message : 'Failed to create task', 'error')
      }
    },
    [showToast],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      setActiveTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      )
      setEditingTask((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))

      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!res.ok) {
          const err = await res.json()
          if (err.code === 'NOT_FOUND') {
            showToast('Task not found', 'error')
            setActiveTasks((prev) => prev.filter((t) => t.id !== id))
          } else {
            throw new Error(err.error || 'Failed to update task')
          }
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update task', 'error')
      }
    },
    [showToast],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const prev = activeTasks.find((t) => t.id === id)
      setActiveTasks((prev) => prev.filter((t) => t.id !== id))
      setCompletedTasks((prev) => prev.filter((t) => t.id !== id))

      try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to delete task')
        }
      } catch (err) {
        // Restore if delete failed
        if (prev) setActiveTasks((tasks) => [prev, ...tasks])
        showToast(err instanceof Error ? err.message : 'Failed to delete task', 'error')
      }
    },
    [activeTasks, showToast],
  )

  const completeTask = useCallback(
    async (id: string) => {
      const task = activeTasks.find((t) => t.id === id)
      if (!task) return

      // Optimistic: remove from active, prepend to completed
      setActiveTasks((prev) => prev.filter((t) => t.id !== id))
      const completedTask = { ...task, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() }
      setCompletedTasks((prev) => [completedTask, ...prev])
      setCompletedExpanded(true)

      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' }),
        })
        if (!res.ok) throw new Error('Failed to complete task')
      } catch (err) {
        // Rollback
        setCompletedTasks((prev) => prev.filter((t) => t.id !== id))
        setActiveTasks((prev) => [task, ...prev])
        showToast(err instanceof Error ? err.message : 'Failed to complete task', 'error')
      }
    },
    [activeTasks, showToast],
  )

  const uncompleteTask = useCallback(
    async (id: string) => {
      const task = completedTasks.find((t) => t.id === id)
      if (!task) return

      setCompletedTasks((prev) => prev.filter((t) => t.id !== id))
      const activeTask = { ...task, status: 'ACTIVE' as const, updatedAt: new Date().toISOString() }
      setActiveTasks((prev) => [activeTask, ...prev])

      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' }),
        })
        if (!res.ok) throw new Error('Failed to uncheck task')
      } catch (err) {
        setActiveTasks((prev) => prev.filter((t) => t.id !== id))
        setCompletedTasks((prev) => [task, ...prev])
        showToast(err instanceof Error ? err.message : 'Failed to uncheck task', 'error')
      }
    },
    [completedTasks, showToast],
  )

  const reorderTasks = useCallback(
    async (newOrder: Task[]) => {
      setActiveTasks(newOrder)
      // Persist each task's sortOrder
      const patches = newOrder.map((task, index) =>
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: index }),
        }),
      )
      try {
        await Promise.all(patches)
      } catch {
        showToast('Failed to save order', 'error')
      }
    },
    [showToast],
  )

  const bulkCreateTasks = useCallback(
    async (tasks: ParsedTask[]) => {
      try {
        const res = await fetch('/api/tasks/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to save tasks')
        }
        const data = await res.json()
        const created: Task[] = data.created ?? []
        setActiveTasks((prev) => [...created, ...prev])
        showToast(`${created.length} task${created.length !== 1 ? 's' : ''} added`, 'success')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to save tasks', 'error')
      }
    },
    [showToast],
  )

  const clearCompleted = useCallback(async () => {
    const toDelete = [...completedTasks]
    setCompletedTasks([])

    try {
      await Promise.all(
        toDelete.map((t) =>
          fetch(`/api/tasks/${t.id}`, { method: 'DELETE' }),
        ),
      )
      showToast('Completed tasks cleared', 'success')
    } catch {
      setCompletedTasks(toDelete)
      showToast('Failed to clear completed tasks', 'error')
    }
  }, [completedTasks, showToast])

  // ─── DnD ─────────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = activeTasks.findIndex((t) => t.id === active.id)
      const newIndex = activeTasks.findIndex((t) => t.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(activeTasks, oldIndex, newIndex)
      reorderTasks(reordered)
    },
    [activeTasks, reorderTasks],
  )

  // ─── Filter logic ─────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0]

  const filteredTasks = activeTasks.filter((task) => {
    if (filter === 'ALL') return true
    if (filter === 'HIGH') return task.priority === 'HIGH'
    if (filter === 'MEDIUM') return task.priority === 'MEDIUM'
    if (filter === 'LOW') return task.priority === 'LOW'
    if (filter === 'DUE_TODAY') return task.dueDate?.startsWith(today) ?? false
    return true
  })

  // ─── Voice flow ───────────────────────────────────────────────────────────

  const handleTasksParsed = useCallback((tasks: ParsedTask[]) => {
    if (tasks.length === 0) {
      showToast('No tasks found in your voice note', 'error')
      return
    }
    setPreviewTasks(tasks)
  }, [showToast])

  const handlePreviewConfirm = useCallback(
    async (tasks: ParsedTask[]) => {
      setPreviewTasks(null)
      await bulkCreateTasks(tasks)
    },
    [bulkCreateTasks],
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  const isPanelOpen = editingTask !== null

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
          focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg',
              'bg-surface-raised border border-border max-w-[320px]',
              'border-l-4',
              toast.type === 'success' ? 'border-l-completed' : 'border-l-danger',
              toast.exiting ? 'toast-exit' : 'toast-enter',
            )}
          >
            <span className="flex-1 text-sm font-inter text-text-primary">
              {toast.message}
            </span>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
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
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between gap-4">
          <h1 className="font-syne font-bold text-[2.5rem] leading-[1.1] tracking-[-0.02em] text-text-primary flex-shrink-0">
            TaskFlow
          </h1>
          <VoiceBrainDump
            onTasksParsed={handleTasksParsed}
            onError={(msg) => showToast(msg, 'error')}
          />
        </div>
      </header>

      {/* Filter bar */}
      <FilterBar active={filter} onChange={setFilter} />

      {/* Main content */}
      <div
        id="main-content"
        className={cn(
          'transition-opacity duration-250',
          isPanelOpen ? 'board-dimmed' : 'board-normal',
        )}
        onClick={isPanelOpen ? () => setEditingTask(null) : undefined}
      >
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-8">
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.75rem] font-medium tracking-[0.04em] uppercase text-text-muted font-inter">
              Tasks
              {filteredTasks.length > 0 && (
                <span className="ml-2 text-[0.75rem] text-text-muted">
                  ({filteredTasks.length})
                </span>
              )}
            </span>
          </div>

          {/* Quick add */}
          <div onClick={(e) => e.stopPropagation()}>
            <QuickAddRow onAdd={createTask} />
          </div>

          {/* Active task list */}
          {isLoading ? (
            <div role="list" aria-label="Loading tasks">
              {Array.from({ length: 4 }).map((_, i) => (
                <TaskRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState />
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul role="list" aria-label="Active tasks">
                    {filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onComplete={completeTask}
                        onDelete={deleteTask}
                        onEdit={setEditingTask}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Completed section */}
          {!isLoading && (
            <div onClick={(e) => e.stopPropagation()}>
              <CompletedSection
                tasks={completedTasks}
                onUncomplete={uncompleteTask}
                onDelete={deleteTask}
                onClear={clearCompleted}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      <div onClick={(e) => e.stopPropagation()}>
        <TaskEditPanel
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updateTask}
        />
      </div>

      {/* Voice preview modal */}
      {previewTasks && (
        <VoicePreviewModal
          tasks={previewTasks}
          onConfirm={handlePreviewConfirm}
          onCancel={() => setPreviewTasks(null)}
        />
      )}
    </div>
  )
}
