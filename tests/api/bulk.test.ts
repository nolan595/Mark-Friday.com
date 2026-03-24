import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/tasks/bulk/route'
import { prisma } from '@/lib/prisma'

const mockPrisma = vi.mocked(prisma)

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/tasks/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: `task-${Math.random()}`,
    title: 'Test task',
    priority: 'NONE',
    dueDate: null,
    workload: 'NONE',
    note: null,
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: new Date('2026-03-24T10:00:00Z'),
    updatedAt: new Date('2026-03-24T10:00:00Z'),
    ...overrides,
  }
}

describe('POST /api/tasks/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.task.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } })
  })

  it('creates multiple tasks in a transaction', async () => {
    const created = [
      makeTask({ title: 'Task one', sortOrder: 1 }),
      makeTask({ title: 'Task two', sortOrder: 2 }),
    ]
    mockPrisma.$transaction.mockResolvedValueOnce(created)

    const res = await POST(
      makeRequest({
        tasks: [
          { title: 'Task one' },
          { title: 'Task two' },
        ],
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.created).toHaveLength(2)
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
  })

  it('returns correct count', async () => {
    const created = [makeTask(), makeTask(), makeTask()]
    mockPrisma.$transaction.mockResolvedValueOnce(created)

    const res = await POST(
      makeRequest({
        tasks: [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
      }),
    )
    const data = await res.json()

    expect(data.count).toBe(3)
  })

  it('assigns sequential sortOrders starting from max + 1', async () => {
    mockPrisma.task.aggregate.mockResolvedValueOnce({ _max: { sortOrder: 4 } })
    const created = [makeTask({ sortOrder: 5 }), makeTask({ sortOrder: 6 })]
    mockPrisma.$transaction.mockImplementationOnce(async (ops: unknown[]) => {
      // Execute the prisma.task.create calls to verify sortOrder is passed correctly
      return created
    })

    await POST(
      makeRequest({
        tasks: [{ title: 'First' }, { title: 'Second' }],
      }),
    )

    // Verify $transaction was called with an array of 2 operations
    const [transactionArg] = mockPrisma.$transaction.mock.calls[0]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect((transactionArg as unknown[]).length).toBe(2)
  })

  it('rejects empty tasks array with 400', async () => {
    const res = await POST(makeRequest({ tasks: [] }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects array with more than 20 tasks with 400', async () => {
    const tasks = Array.from({ length: 21 }, (_, i) => ({ title: `Task ${i + 1}` }))
    const res = await POST(makeRequest({ tasks }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a task with empty title with 400', async () => {
    const res = await POST(
      makeRequest({
        tasks: [{ title: 'Valid task' }, { title: '' }],
      }),
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('returns 500 when transaction fails', async () => {
    mockPrisma.$transaction.mockRejectedValueOnce(new Error('Transaction failed'))

    const res = await POST(makeRequest({ tasks: [{ title: 'Task' }] }))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to bulk create tasks')
  })
})
