import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock() is hoisted to the top of the file at transform time.
// Any variable the mock factory closes over must also be hoisted via vi.hoisted()
// — otherwise the variable is still `undefined` when the factory runs.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}))

// Import the route AFTER the mock is in place
const { POST } = await import('@/app/api/voice/parse/route')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/voice/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeAiResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
    role: 'assistant',
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 20 },
  }
}

const validTasksJson = JSON.stringify([
  { title: 'Finish Q3 report', priority: 'HIGH', dueDate: '2026-03-28', workload: 'HEAVY' },
  { title: 'Call accountant', priority: 'MEDIUM', dueDate: null, workload: 'LIGHT' },
])

describe('POST /api/voice/parse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses a normal multi-task transcript into structured tasks', async () => {
    mockCreate.mockResolvedValueOnce(makeAiResponse(validTasksJson))

    const res = await POST(
      makeRequest({
        transcript: 'finish the Q3 report high priority, call accountant next week',
        currentDate: '2026-03-24',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tasks).toHaveLength(2)
    expect(data.tasks[0].title).toBe('Finish Q3 report')
    expect(data.tasks[0].priority).toBe('HIGH')
    expect(data.tasks[1].workload).toBe('LIGHT')
  })

  it('handles a transcript where AI returns empty array', async () => {
    mockCreate.mockResolvedValueOnce(makeAiResponse('[]'))

    const res = await POST(
      makeRequest({
        transcript: 'hmm yeah I dunno',
        currentDate: '2026-03-24',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tasks).toEqual([])
  })

  it('returns 400 for missing transcript field', async () => {
    const res = await POST(makeRequest({ currentDate: '2026-03-24' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for missing currentDate field', async () => {
    const res = await POST(
      makeRequest({ transcript: 'do something important' }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for currentDate not matching YYYY-MM-DD format', async () => {
    const res = await POST(
      makeRequest({
        transcript: 'do something',
        currentDate: '24/03/2026',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 422 if AI returns malformed JSON', async () => {
    mockCreate.mockResolvedValueOnce(makeAiResponse('not json at all'))

    const res = await POST(
      makeRequest({
        transcript: 'some transcript',
        currentDate: '2026-03-24',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.code).toBe('AI_PARSE_ERROR')
  })

  it('returns 422 if AI returns valid JSON but not an array', async () => {
    mockCreate.mockResolvedValueOnce(makeAiResponse('{"task": "do something"}'))

    const res = await POST(
      makeRequest({
        transcript: 'some transcript',
        currentDate: '2026-03-24',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.code).toBe('AI_PARSE_ERROR')
  })

  it('passes currentDate in the system prompt', async () => {
    mockCreate.mockResolvedValueOnce(makeAiResponse('[]'))

    await POST(
      makeRequest({
        transcript: 'do something',
        currentDate: '2026-03-24',
      }),
    )

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('2026-03-24'),
      }),
    )
  })

  it('validates and accepts all valid Priority and Workload enum values', async () => {
    const allValuesJson = JSON.stringify([
      { title: 'Task A', priority: 'HIGH', dueDate: null, workload: 'LIGHT' },
      { title: 'Task B', priority: 'MEDIUM', dueDate: null, workload: 'MEDIUM' },
      { title: 'Task C', priority: 'LOW', dueDate: null, workload: 'HEAVY' },
      { title: 'Task D', priority: 'NONE', dueDate: null, workload: 'NONE' },
    ])
    mockCreate.mockResolvedValueOnce(makeAiResponse(allValuesJson))

    const res = await POST(
      makeRequest({
        transcript: 'multiple tasks with different priorities',
        currentDate: '2026-03-24',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tasks).toHaveLength(4)
    expect(data.tasks[0].priority).toBe('HIGH')
    expect(data.tasks[2].workload).toBe('HEAVY')
  })

  it('rejects transcript that is empty string with 400', async () => {
    const res = await POST(
      makeRequest({ transcript: '', currentDate: '2026-03-24' }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects transcript over 2000 characters with 400', async () => {
    const res = await POST(
      makeRequest({ transcript: 'a'.repeat(2001), currentDate: '2026-03-24' }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 500 when AI client throws unexpectedly', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API unreachable'))

    const res = await POST(
      makeRequest({
        transcript: 'do something',
        currentDate: '2026-03-24',
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to parse transcript')
  })
})
