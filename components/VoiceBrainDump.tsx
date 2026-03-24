'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { ParsedTask } from '@/types'

type VoiceState = 'idle' | 'recording' | 'parsing'

interface VoiceBrainDumpProps {
  onTasksParsed: (tasks: ParsedTask[]) => void
  onError: (message: string) => void
}

// Browser Speech Recognition API types
interface SpeechRecognitionResultItem {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionResultItem
  [index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

export default function VoiceBrainDump({ onTasksParsed, onError }: VoiceBrainDumpProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcriptRef = useRef('')
  // Mirrors voiceState so event handlers can read the current value without
  // needing to be re-created on every state change (avoids stale closures in
  // recognition callbacks and prevents calling async work from inside a state setter)
  const voiceStateRef = useRef<VoiceState>('idle')

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const resetSilenceTimer = useCallback(
    (onSilence: () => void) => {
      clearSilenceTimer()
      silenceTimerRef.current = setTimeout(onSilence, 3000)
    },
    [clearSilenceTimer],
  )

  const stopAndParse = useCallback(async () => {
    clearSilenceTimer()

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    const finalTranscript = transcriptRef.current.trim()

    if (finalTranscript.length < 5) {
      voiceStateRef.current = 'idle'
      setVoiceState('idle')
      setTranscript('')
      onError("Didn't catch that — try again")
      return
    }

    voiceStateRef.current = 'parsing'
    setVoiceState('parsing')

    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript, currentDate: today }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse transcript')
      }

      onTasksParsed(data.tasks ?? [])
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse transcript')
    } finally {
      voiceStateRef.current = 'idle'
      setVoiceState('idle')
      setTranscript('')
      transcriptRef.current = ''
    }
  }, [clearSilenceTimer, onError, onTasksParsed])

  const startRecording = useCallback(async () => {
    const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null
    const SpeechRecognitionAPI = w
      ? ((w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as SpeechRecognitionConstructor | undefined)
      : null

    if (!SpeechRecognitionAPI) {
      onError('Voice input is not supported in this browser')
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      onError('Microphone permission denied')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    transcriptRef.current = ''

    recognition.onresult = (rawEvent) => {
      const e = rawEvent as SpeechRecognitionEvent
      let interim = ''
      let final = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        transcriptRef.current += final + ' '
      }
      setTranscript(transcriptRef.current + interim)

      // Reset silence timer on each result
      resetSilenceTimer(() => stopAndParse())
    }

    recognition.onerror = (rawErr) => {
      const event = rawErr as SpeechRecognitionErrorEvent
      if (event.error === 'no-speech') {
        stopAndParse()
      } else {
        onError('Voice recognition error — try again')
        voiceStateRef.current = 'idle'
        setVoiceState('idle')
        setTranscript('')
        transcriptRef.current = ''
      }
    }

    recognition.onend = () => {
      // If still in recording state, recognition ended unexpectedly — parse what we have.
      // Read from ref to avoid stale closure; do NOT call async work inside a state setter.
      if (voiceStateRef.current === 'recording') {
        stopAndParse()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    voiceStateRef.current = 'recording'
    setVoiceState('recording')

    // Start initial silence timer
    resetSilenceTimer(() => stopAndParse())
  }, [onError, resetSilenceTimer, stopAndParse])

  const handleClick = useCallback(() => {
    if (voiceState === 'idle') {
      startRecording()
    } else if (voiceState === 'recording') {
      stopAndParse()
    }
    // parsing state: do nothing, button is disabled
  }, [voiceState, startRecording, stopAndParse])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer()
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [clearSilenceTimer])

  const isRecording = voiceState === 'recording'
  const isParsing = voiceState === 'parsing'
  const isIdle = voiceState === 'idle'

  const ariaLabel = isIdle
    ? 'Start voice input'
    : isRecording
      ? 'Stop recording'
      : 'Parsing voice input'

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        {/* Concentric rings (recording state) */}
        {isRecording && (
          <>
            <span
              aria-hidden="true"
              className="voice-ring-1 absolute inset-0 rounded-full border-2 border-danger"
            />
            <span
              aria-hidden="true"
              className="voice-ring-2 absolute inset-0 rounded-full border-2 border-danger"
            />
            <span
              aria-hidden="true"
              className="voice-ring-3 absolute inset-0 rounded-full border-2 border-danger"
            />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={isParsing}
          aria-label={ariaLabel}
          aria-pressed={isRecording}
          className={cn(
            'relative inline-flex items-center gap-2 rounded-full px-4 h-10',
            'text-sm font-medium font-inter transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            'disabled:cursor-not-allowed',
            isIdle && 'voice-idle bg-accent text-white hover:brightness-110',
            isRecording && 'bg-danger text-white',
            isParsing && 'bg-surface border border-border text-text-muted',
          )}
        >
          {isIdle && (
            <>
              <MicIcon />
              Brain dump
            </>
          )}
          {isRecording && (
            <>
              <StopIcon />
              Recording…
            </>
          )}
          {isParsing && (
            <>
              <SpinnerIcon />
              Parsing…
            </>
          )}
        </button>
      </div>

      {/* Live transcript */}
      {isRecording && transcript && (
        <p
          className="text-[0.6875rem] font-inter text-text-muted italic max-w-[240px] text-right leading-relaxed"
          aria-live="polite"
          aria-label="Voice transcript"
        >
          {transcript}
        </p>
      )}
    </div>
  )
}

function MicIcon() {
  return (
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
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
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
  )
}
