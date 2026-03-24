import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '@/app/api/tasks/[id]/route'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const mockPrisma = vi.mocked(prisma)

type RouteParams = { params: { id: string } }

function makePatchRequest(id: string, body: unknown): [Request, RouteParams] {
  return [
    new Request(`http://localhost/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: { id } },
  ]
}

function makeDeleteRequest(id: string): [Request, RouteParams] {
  return [
    new Request(`http://localhost/api/tasks/${id}`, { method: 'DELETE' }),
    { params: { id } },
  ]
}

const baseTask = {
  id: 'task-abc',
  title: 'Original title',
  priority: 'NONE',
  dueDate: null,
  workload: 'NONE',
  note: null,
  status: 'ACTIVE',
  sortOrder: 1,
  createdAt: new Date('2026-03-24T10:00:00Z'),
  updatedAt: new Date('2026-03-24T10:00:00Z'),
}

// Build a Prisma P2025 error (record not found)
function makeNotFoundError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: '5.0.0',
  })
}

describe('PATCH /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates title only', async () => {
    const updated = { ...baseTask, title: 'Updated title' }
    mockPrisma.task.update.mockResolvedValueOnce(updated)

    const res = await PATCH(...makePatchRequest('task-abc', { title: 'Updated title' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.title).toBe('Updated title')
  })

  it('updates status to COMPLETED', async () => {
    const updated = { ...baseTask, status: 'COMPLETED' }
    mockPrisma.task.update.mockResolvedValueOnce(updated)

    const res = await PATCH(...makePatchRequest('task-abc', { status: 'COMPLETED' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('COMPLETED')
  })

  it('updates multiple fields at once', async () => {
    const updated = { ...baseTask, priority: 'HIGH', workload: 'HEAVY', note: 'New note' }
    mockPrisma.task.update.mockResolvedValueOnce(updated)

    const res = await PATCH(
      ...makePatchRequest('task-abc', { priority: 'HIGH', workload: 'HEAVY', note: 'New note' }),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.priority).toBe('HIGH')
    expect(data.workload).toBe('HEAVY')
    expect(data.note).toBe('New note')
  })

  it('returns 400 for invalid priority value', async () => {
    const res = await PATCH(...makePatchRequest('task-abc', { priority: 'CRITICAL' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(mockPrisma.task.update).not.toHaveBeenCalled()
  })

  it('returns 400 when title is empty string', async () => {
    const res = await PATCH(...makePatchRequest('task-abc', { title: '' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 for non-existent task ID', async () => {
    mockPrisma.task.update.mockRejectedValueOnce(makeNotFoundError())

    const res = await PATCH(...makePatchRequest('does-not-exist', { title: 'New' }))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.code).toBe('NOT_FOUND')
  })

  it('returns 500 for unexpected database errors', async () => {
    mockPrisma.task.update.mockRejectedValueOnce(new Error('Unexpected DB error'))

    const res = await PATCH(...makePatchRequest('task-abc', { title: 'New' }))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to update task')
  })
})

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes an existing task and returns { success: true }', async () => {
    mockPrisma.task.delete.mockResolvedValueOnce(baseTask)

    const res = await DELETE(...makeDeleteRequest('task-abc'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ success: true })
    expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-abc' } })
  })

  it('returns 404 for non-existent task ID', async () => {
    mockPrisma.task.delete.mockRejectedValueOnce(makeNotFoundError())

    const res = await DELETE(...makeDeleteRequest('does-not-exist'))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.code).toBe('NOT_FOUND')
  })

  it('returns 500 for unexpected database errors', async () => {
    mockPrisma.task.delete.mockRejectedValueOnce(new Error('DB error'))

    const res = await DELETE(...makeDeleteRequest('task-abc'))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to delete task')
  })
})
