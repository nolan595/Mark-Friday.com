import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']).optional().default('NONE'),
  dueDate: z.string().nullable().optional(),
  workload: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'NONE']).optional().default('NONE'),
  note: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const [active, completed] = await Promise.all([
      prisma.task.findMany({
        where: { status: 'ACTIVE' },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.task.findMany({
        where: { status: 'COMPLETED' },
        orderBy: [{ updatedAt: 'desc' }],
      }),
    ])

    return NextResponse.json({ active, completed })
  } catch (err) {
    console.error('[GET /api/tasks]', err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, priority, dueDate, workload, note } = parsed.data

    const maxOrder = await prisma.task.aggregate({ _max: { sortOrder: true } })
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1

    const task = await prisma.task.create({
      data: {
        title,
        priority: priority ?? 'NONE',
        dueDate: dueDate ? new Date(dueDate) : null,
        workload: workload ?? 'NONE',
        note: note ?? null,
        sortOrder: nextOrder,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tasks]', err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
