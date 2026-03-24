import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/tasks/route'
import { prisma } from '@/lib/prisma'

const mockPrisma = vi.mocked(prisma)

// Helper — build a minimal Request with optional JSON body
function makeRequest(body?: unknown): Request {
  if (body === undefined) {
    return new Request('http://localhost/api/tasks')
  }
  return new Request('http://localhost/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const baseTask = {
  id: 'task-1',
  title: 'Test task',
  priority: 'NONE',
  dueDate: null,
  workload: 'NONE',
  note: null,
  status: 'ACTIVE',
  sortOrder: 1,
  createdAt: new Date('2026-03-24T10:00:00Z'),
  updatedAt: new Date('2026-03-24T10:00:00Z'),
}

const completedTask = { ...baseTask, id: 'task-2', status: 'COMPLETED', sortOrder: 0 }

describe('GET /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { active: [], completed: [] } when no tasks exist', async () => {
    mockPrisma.task.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ active: [], completed: [] })
  })

  it('separates active and completed tasks correctly', async () => {
    mockPrisma.task.findMany
      .mockResolvedValueOnce([baseTask])
      .mockResolvedValueOnce([completedTask])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.active).toHaveLength(1)
    expect(data.active[0].id).toBe('task-1')
    expect(data.completed).toHaveLength(1)
    expect(data.completed[0].id).toBe('task-2')
  })

  it('returns 500 when database throws', async () => {
    mockPrisma.task.findMany.mockRejectedValueOnce(new Error('DB down'))

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to fetch tasks')
  })
})

describe('POST /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.task.aggregate.mockResolvedValue({ _max: { sortOrder: 5 } })
  })

  it('creates a task with title only', async () => {
    const created = { ...baseTask, sortOrder: 6 }
    mockPrisma.task.create.mockResolvedValueOnce(created)

    const res = await POST(makeRequest({ title: 'Simple task' }))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.id).toBe('task-1')
    expect(mockPrisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Simple task',
          priority: 'NONE',
          workload: 'NONE',
          sortOrder: 6,
        }),
      }),
    )
  })

  it('creates a task with all optional fields', async () => {
    const created = {
      ...baseTask,
      title: 'Full task',
      priority: 'HIGH',
      dueDate: new Date('2026-03-31'),
      workload: 'HEAVY',
      note: 'A note',
      sortOrder: 6,
    }
    mockPrisma.task.create.mockResolvedValueOnce(created)

    const res = await POST(
      makeRequest({
        title: 'Full task',
        priority: 'HIGH',
        dueDate: '2026-03-31',
        workload: 'HEAVY',
        note: 'A note',
      }),
    )

    expect(res.status).toBe(201)
    expect(mockPrisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Full task',
          priority: 'HIGH',
          workload: 'HEAVY',
          note: 'A note',
        }),
      }),
    )
  })

  it('rejects empty title with 400', async () => {
    const res = await POST(makeRequest({ title: '' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockPrisma.task.create).not.toHaveBeenCalled()
  })

  it('rejects invalid priority value with 400', async () => {
    const res = await POST(makeRequest({ title: 'Task', priority: 'URGENT' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('rejects title over 500 characters with 400', async () => {
    const res = await POST(makeRequest({ title: 'a'.repeat(501) }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('assigns sortOrder as max + 1', async () => {
    mockPrisma.task.aggregate.mockResolvedValueOnce({ _max: { sortOrder: 9 } })
    mockPrisma.task.create.mockResolvedValueOnce({ ...baseTask, sortOrder: 10 })

    await POST(makeRequest({ title: 'New task' }))

    expect(mockPrisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sortOrder: 10 }),
      }),
    )
  })

  it('assigns sortOrder 1 when no tasks exist (max is null)', async () => {
    mockPrisma.task.aggregate.mockResolvedValueOnce({ _max: { sortOrder: null } })
    mockPrisma.task.create.mockResolvedValueOnce({ ...baseTask, sortOrder: 1 })

    await POST(makeRequest({ title: 'First task' }))

    expect(mockPrisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sortOrder: 1 }),
      }),
    )
  })

  it('returns 500 when database throws', async () => {
    mockPrisma.task.create.mockRejectedValueOnce(new Error('DB error'))

    const res = await POST(makeRequest({ title: 'Task' }))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to create task')
  })
})
