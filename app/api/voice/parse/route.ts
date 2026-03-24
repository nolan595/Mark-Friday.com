import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic()

const requestSchema = z.object({
  transcript: z.string().min(1).max(2000),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'currentDate must be YYYY-MM-DD'),
})

const parsedTaskSchema = z.array(
  z.object({
    title: z.string(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']),
    dueDate: z.string().nullable(),
    workload: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'NONE']),
  })
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { transcript, currentDate } = parsed.data

    const systemPrompt = `You are a task extraction assistant. Extract every distinct task from the user's voice transcript.

For each task return:
- title: short, actionable task name (max 80 characters)
- priority: "HIGH", "MEDIUM", "LOW", or "NONE" — infer from urgency language ("urgent", "ASAP" = HIGH; "whenever" = LOW)
- dueDate: ISO date string YYYY-MM-DD if a date is mentioned, null otherwise. Today is ${currentDate}. Resolve relative dates: "today" = today, "tomorrow" = tomorrow, "this Friday" = the coming Friday, "next week" = 7 days from today, "end of month" = last day of current month.
- workload: "LIGHT", "MEDIUM", "HEAVY", or "NONE" — infer if complexity language is present

Return ONLY a valid JSON array with no preamble, markdown, or explanation.
Example output: [{"title":"Finish Q3 report","priority":"HIGH","dueDate":"2026-03-28","workload":"HEAVY"},{"title":"Call accountant","priority":"MEDIUM","dueDate":null,"workload":"LIGHT"}]

If the transcript contains nothing actionable, return an empty array: []`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: transcript,
        },
      ],
      system: systemPrompt,
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: 'Unexpected response format from AI', code: 'AI_RESPONSE_ERROR' },
        { status: 422 }
      )
    }

    let tasks: unknown
    try {
      tasks = JSON.parse(content.text)
    } catch {
      console.error('[POST /api/voice/parse] JSON parse failed:', content.text.slice(0, 200))
      return NextResponse.json(
        {
          error: "Couldn't parse that — try again or add tasks manually",
          code: 'AI_PARSE_ERROR',
        },
        { status: 422 }
      )
    }

    const validated = parsedTaskSchema.safeParse(tasks)
    if (!validated.success) {
      console.error('[POST /api/voice/parse] Schema validation failed:', validated.error.message)
      return NextResponse.json(
        {
          error: "Couldn't parse that — try again or add tasks manually",
          code: 'AI_PARSE_ERROR',
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ tasks: validated.data })
  } catch (err) {
    console.error('[POST /api/voice/parse]', err)
    return NextResponse.json({ error: 'Failed to parse transcript' }, { status: 500 })
  }
}
