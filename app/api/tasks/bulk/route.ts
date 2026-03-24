import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkCreateSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(500),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']).optional().default('NONE'),
        dueDate: z.string().nullable().optional(),
        workload: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'NONE']).optional().default('NONE'),
      })
    )
    .min(1)
    .max(20),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bulkCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const maxOrder = await prisma.task.aggregate({ _max: { sortOrder: true } })
    let nextOrder = (maxOrder._max.sortOrder ?? 0) + 1

    const created = await prisma.$transaction(
      parsed.data.tasks.map((t) =>
        prisma.task.create({
          data: {
            title: t.title,
            priority: t.priority ?? 'NONE',
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            workload: t.workload ?? 'NONE',
            sortOrder: nextOrder++,
          },
        })
      )
    )

    return NextResponse.json({ created, count: created.length }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tasks/bulk]', err)
    return NextResponse.json({ error: 'Failed to bulk create tasks' }, { status: 500 })
  }
}
