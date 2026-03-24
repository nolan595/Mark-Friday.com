'use client'

interface EmptyStateProps {
  onBrainDump?: () => void
}

export default function EmptyState({ onBrainDump }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Inbox-zero SVG illustration */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="mb-6"
      >
        {/* Tray outline */}
        <rect
          x="10"
          y="28"
          width="60"
          height="38"
          rx="6"
          stroke="#2A2A35"
          strokeWidth="2"
          fill="none"
        />
        {/* Tray inbox slot */}
        <path
          d="M10 48 L24 48 C24 52 27 54 30 54 L50 54 C53 54 56 52 56 48 L70 48"
          stroke="#2A2A35"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Checkmark circle */}
        <circle
          cx="40"
          cy="20"
          r="12"
          stroke="#8888A0"
          strokeWidth="2"
          fill="none"
        />
        {/* Checkmark path */}
        <path
          d="M34 20 L38 24 L46 16"
          stroke="#8888A0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Small dots suggesting empty state */}
        <circle cx="28" cy="60" r="2" fill="#2A2A35" />
        <circle cx="40" cy="60" r="2" fill="#2A2A35" />
        <circle cx="52" cy="60" r="2" fill="#2A2A35" />
      </svg>

      <h2 className="font-syne font-bold text-xl text-text-primary mb-2 tracking-[-0.01em]">
        Nothing on your plate
      </h2>
      <p className="text-sm text-text-muted font-inter max-w-xs leading-relaxed">
        Hit the brain dump button to add tasks with your voice
      </p>

      {onBrainDump && (
        <button
          onClick={onBrainDump}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent text-white px-5 py-2.5
            text-sm font-medium font-inter transition-all duration-200 hover:brightness-110
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Brain dump
        </button>
      )}
    </div>
  )
}
