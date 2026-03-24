'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface QuickAddRowProps {
  onAdd: (title: string) => void
}

export default function QuickAddRow({ onAdd }: QuickAddRowProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
    inputRef.current?.focus()
  }, [value, onAdd])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <form
      role="form"
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="flex items-center h-14 border-b border-border bg-surface group/form"
    >
      {/* Spacer to align with task title column (drag handle + checkbox) */}
      <div className="flex-shrink-0 w-4 hidden md:block" aria-hidden="true" />
      <div className="flex-shrink-0 w-3 hidden md:block" aria-hidden="true" />
      <div className="flex-shrink-0 w-5 ml-4 md:ml-3" aria-hidden="true" />
      <div className="flex-shrink-0 w-3" aria-hidden="true" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Add a task"
        placeholder="Add a task…"
        className={cn(
          'flex-1 h-full bg-transparent',
          'text-sm text-text-primary font-inter',
          'placeholder:text-text-muted',
          'outline-none border-none',
          'focus:placeholder:opacity-0',
          'transition-colors duration-200',
          'px-4 md:px-0',
        )}
      />

      {/* Submit button — visible when input has value */}
      {value.trim() && (
        <button
          type="submit"
          aria-label="Add task"
          className={cn(
            'flex-shrink-0 mr-4 flex items-center justify-center w-6 h-6 rounded-full',
            'bg-accent text-white',
            'transition-all duration-200 hover:brightness-110',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </form>
  )
}
