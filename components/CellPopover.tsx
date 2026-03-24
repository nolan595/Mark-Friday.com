'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PopoverOption {
  value: string
  label: string
  /** Optional colour dot (hex) for priority indicator */
  dotColor?: string
  className?: string
}

interface CellPopoverProps {
  options: PopoverOption[]
  value: string
  onChange: (value: string) => void
  onClose: () => void
  /** Whether this is open — caller controls visibility */
  isOpen: boolean
  /** ARIA role: 'listbox' for discrete values, 'dialog' for date */
  role?: 'listbox' | 'dialog'
  /** aria-label for dialog role */
  ariaLabel?: string
  /** Ref to the trigger element — used to exclude it from outside-click and to return focus on Escape */
  triggerRef?: React.RefObject<HTMLButtonElement | null>
  children?: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CellPopover({
  options,
  value,
  onChange,
  onClose,
  isOpen,
  role = 'listbox',
  ariaLabel,
  triggerRef,
}: CellPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on outside click — exclude the trigger element so the trigger's own
  // onClick can handle the toggle without a close-then-reopen flicker.
  useEffect(() => {
    if (!isOpen) return

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      const insidePopover = popoverRef.current?.contains(target)
      const insideTrigger = triggerRef?.current?.contains(target)
      if (!insidePopover && !insideTrigger) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose, triggerRef])

  // Close on Escape and return focus to the trigger
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef?.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, triggerRef])

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue)
      onClose()
    },
    [onChange, onClose],
  )

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, optionValue: string, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelect(optionValue)
        return
      }

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const buttons = popoverRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')
        if (!buttons) return
        const target = e.key === 'ArrowDown'
          ? buttons[Math.min(index + 1, buttons.length - 1)]
          : buttons[Math.max(index - 1, 0)]
        target?.focus()
      }
    },
    [handleSelect],
  )

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      role={role}
      aria-label={ariaLabel}
      className={cn(
        'absolute z-30 top-full left-0 mt-1',
        'bg-surface-raised border border-border rounded-lg py-1',
        'min-w-[160px] max-h-[240px] overflow-y-auto',
        'cell-popover',
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(option.value)}
            onKeyDown={(e) => handleOptionKeyDown(e, option.value, index)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-0 h-9',
              'text-left text-sm font-inter',
              'hover:bg-border transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
              isSelected ? 'text-accent' : option.className ?? 'text-text-primary',
            )}
          >
            {/* Priority colour dot */}
            {option.dotColor !== undefined && (
              <span
                aria-hidden="true"
                style={option.dotColor ? { backgroundColor: option.dotColor } : undefined}
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  !option.dotColor && 'opacity-0',
                )}
              />
            )}

            <span className={cn('flex-1', !option.dotColor && option.dotColor !== undefined && 'pl-[18px]')}>
              {option.label}
            </span>

            {/* Active checkmark */}
            {isSelected && (
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
                className="flex-shrink-0 text-text-muted"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
