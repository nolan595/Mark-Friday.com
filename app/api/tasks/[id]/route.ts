import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
  dueDate: z.string().nullable().optional(),
  workload: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'NONE']).optional(),
  note: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
  sortOrder: z.number().int().optional(),
})

type RouteParams = { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const parsed = updateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { dueDate, ...rest } = parsed.data

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    })

    return NextResponse.json(task)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    console.error('[PATCH /api/tasks/[id]]', err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await prisma.task.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    console.error('[DELETE /api/tasks/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
