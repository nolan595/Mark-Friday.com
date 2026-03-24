# API Specification — Friday TaskFlow

## Overview

All API routes are Next.js App Router route handlers under `app/api/`. They accept and return JSON. No authentication is required — this is a single-user personal tool.

### Error shape

Every error response follows this consistent envelope:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

`details` is only present on validation errors and contains the flattened Zod error object.

### Common HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 400 | Validation error |
| 404 | Resource not found |
| 422 | Unprocessable — AI response could not be parsed |
| 500 | Internal server error |

---

## Endpoints

### 1. `GET /api/tasks`

Fetch all tasks, split into active and completed lists.

**Auth:** None

**Request:** No body, no query params.

**Response — 200 OK**

```json
{
  "active": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Finish Q3 report",
      "priority": "HIGH",
      "dueDate": "2026-03-28T00:00:00.000Z",
      "workload": "HEAVY",
      "note": "Include finance team projections",
      "status": "ACTIVE",
      "sortOrder": 1,
      "createdAt": "2026-03-24T10:00:00.000Z",
      "updatedAt": "2026-03-24T10:00:00.000Z"
    }
  ],
  "completed": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Send weekly update",
      "priority": "NONE",
      "dueDate": null,
      "workload": "LIGHT",
      "note": null,
      "status": "COMPLETED",
      "sortOrder": 0,
      "createdAt": "2026-03-23T09:00:00.000Z",
      "updatedAt": "2026-03-24T08:30:00.000Z"
    }
  ]
}
```

Active tasks are ordered by `sortOrder ASC`, then `createdAt DESC`.
Completed tasks are ordered by `updatedAt DESC` (most recently completed first).

**Response — 500**

```json
{ "error": "Failed to fetch tasks" }
```

---

### 2. `POST /api/tasks`

Create a single task.

**Auth:** None

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1–500 characters |
| `priority` | `"HIGH" \| "MEDIUM" \| "LOW" \| "NONE"` | No | Defaults to `"NONE"` |
| `dueDate` | string (ISO date `YYYY-MM-DD`) \| null | No | |
| `workload` | `"LIGHT" \| "MEDIUM" \| "HEAVY" \| "NONE"` | No | Defaults to `"NONE"` |
| `note` | string \| null | No | |

```json
{
  "title": "Call accountant",
  "priority": "MEDIUM",
  "dueDate": "2026-03-31",
  "workload": "LIGHT",
  "note": "Re: Q1 receipts"
}
```

`sortOrder` is auto-assigned as `current_max + 1`, placing the task at the end of the active list.

**Response — 201 Created**

Returns the full created task object.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "title": "Call accountant",
  "priority": "MEDIUM",
  "dueDate": "2026-03-31T00:00:00.000Z",
  "workload": "LIGHT",
  "note": "Re: Q1 receipts",
  "status": "ACTIVE",
  "sortOrder": 5,
  "createdAt": "2026-03-24T11:00:00.000Z",
  "updatedAt": "2026-03-24T11:00:00.000Z"
}
```

**Response — 400**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": { "title": ["String must contain at least 1 character(s)"] },
    "formErrors": []
  }
}
```

**Response — 500**

```json
{ "error": "Failed to create task" }
```

---

### 3. `PATCH /api/tasks/[id]`

Partial update — accepts any subset of task fields. All fields are optional. `updatedAt` is always updated by Prisma.

**Auth:** None

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID string | Task ID |

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | No | 1–500 characters |
| `priority` | `"HIGH" \| "MEDIUM" \| "LOW" \| "NONE"` | No | |
| `dueDate` | string (ISO date) \| null | No | |
| `workload` | `"LIGHT" \| "MEDIUM" \| "HEAVY" \| "NONE"` | No | |
| `note` | string \| null | No | |
| `status` | `"ACTIVE" \| "COMPLETED"` | No | |
| `sortOrder` | integer | No | |

Used for: editing any field, toggling task completion (`status`), and persisting reorder positions (`sortOrder`).

To clear a nullable field (dueDate, note), pass `null` explicitly.

**Example — toggle complete**

```json
{ "status": "COMPLETED" }
```

**Example — reorder**

```json
{ "sortOrder": 3 }
```

**Response — 200 OK**

Returns the full updated task object.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "title": "Call accountant",
  "priority": "MEDIUM",
  "dueDate": null,
  "workload": "LIGHT",
  "note": null,
  "status": "COMPLETED",
  "sortOrder": 5,
  "createdAt": "2026-03-24T11:00:00.000Z",
  "updatedAt": "2026-03-24T12:00:00.000Z"
}
```

**Response — 400**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": { "priority": ["Invalid enum value."] },
    "formErrors": []
  }
}
```

**Response — 404**

```json
{ "error": "Task not found", "code": "NOT_FOUND" }
```

**Response — 500**

```json
{ "error": "Failed to update task" }
```

---

### 4. `DELETE /api/tasks/[id]`

Hard delete a task. This is permanent — there is no soft delete or recycle bin.

**Auth:** None

**Path params**

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID string | Task ID |

**Request:** No body.

**Response — 200 OK**

```json
{ "success": true }
```

**Response — 404**

```json
{ "error": "Task not found", "code": "NOT_FOUND" }
```

**Response — 500**

```json
{ "error": "Failed to delete task" }
```

---

### 5. `POST /api/tasks/bulk`

Create multiple tasks in a single Prisma transaction. Used after the user confirms parsed tasks from the voice brain dump flow.

**Auth:** None

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tasks` | array | Yes | 1–20 items |
| `tasks[].title` | string | Yes | 1–500 characters |
| `tasks[].priority` | `"HIGH" \| "MEDIUM" \| "LOW" \| "NONE"` | No | Defaults to `"NONE"` |
| `tasks[].dueDate` | string (ISO date) \| null | No | |
| `tasks[].workload` | `"LIGHT" \| "MEDIUM" \| "HEAVY" \| "NONE"` | No | Defaults to `"NONE"` |

```json
{
  "tasks": [
    {
      "title": "Finish Q3 report",
      "priority": "HIGH",
      "dueDate": "2026-03-28",
      "workload": "HEAVY"
    },
    {
      "title": "Call accountant",
      "priority": "MEDIUM",
      "dueDate": null,
      "workload": "LIGHT"
    }
  ]
}
```

`sortOrder` values are auto-assigned sequentially, appending to the end of the active list.

All tasks are created atomically — if any creation fails, none are saved.

**Response — 201 Created**

```json
{
  "created": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "title": "Finish Q3 report",
      "priority": "HIGH",
      "dueDate": "2026-03-28T00:00:00.000Z",
      "workload": "HEAVY",
      "note": null,
      "status": "ACTIVE",
      "sortOrder": 6,
      "createdAt": "2026-03-24T11:30:00.000Z",
      "updatedAt": "2026-03-24T11:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "Call accountant",
      "priority": "MEDIUM",
      "dueDate": null,
      "workload": "LIGHT",
      "note": null,
      "status": "ACTIVE",
      "sortOrder": 7,
      "createdAt": "2026-03-24T11:30:00.000Z",
      "updatedAt": "2026-03-24T11:30:00.000Z"
    }
  ],
  "count": 2
}
```

**Response — 400**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": { "tasks": ["Array must contain at least 1 element(s)"] },
    "formErrors": []
  }
}
```

**Response — 500**

```json
{ "error": "Failed to bulk create tasks" }
```

---

### 6. `POST /api/voice/parse`

Parse a raw voice transcript into structured task objects using the Anthropic Claude API. Returns parsed tasks for the user to review before saving — does not write to the database.

**Auth:** None

**Request body**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `transcript` | string | Yes | 1–2000 characters |
| `currentDate` | string | Yes | ISO date format `YYYY-MM-DD` — used to resolve relative dates ("tomorrow", "next week") |

```json
{
  "transcript": "finish the Q3 report by Friday, that's high priority, also call the accountant next week, medium priority",
  "currentDate": "2026-03-24"
}
```

The route calls `claude-sonnet-4-6` with a system prompt that instructs the model to:
- Extract each distinct task from the transcript
- Infer priority from urgency language
- Resolve relative date references relative to `currentDate`
- Infer workload from complexity language
- Return a raw JSON array — no markdown or prose

If the AI returns an empty array, the response is `{ "tasks": [] }` with status 200.

**Response — 200 OK**

```json
{
  "tasks": [
    {
      "title": "Finish Q3 report",
      "priority": "HIGH",
      "dueDate": "2026-03-28",
      "workload": "HEAVY"
    },
    {
      "title": "Call accountant",
      "priority": "MEDIUM",
      "dueDate": "2026-03-31",
      "workload": "LIGHT"
    }
  ]
}
```

**Response — 400**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": { "currentDate": ["currentDate must be YYYY-MM-DD"] },
    "formErrors": []
  }
}
```

**Response — 422 — AI returned unparseable output**

```json
{
  "error": "Couldn't parse that — try again or add tasks manually",
  "code": "AI_PARSE_ERROR"
}
```

**Response — 500**

```json
{ "error": "Failed to parse transcript" }
```

---

## Database schema

Managed with Prisma. Single model.

### `tasks` table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `uuid()` | |
| `title` | TEXT | NOT NULL | |
| `priority` | ENUM `Priority` | NOT NULL, default `NONE` | `HIGH`, `MEDIUM`, `LOW`, `NONE` |
| `due_date` | DATE | nullable | Stored as date-only, no time component |
| `workload` | ENUM `Workload` | NOT NULL, default `NONE` | `LIGHT`, `MEDIUM`, `HEAVY`, `NONE` |
| `note` | TEXT | nullable | |
| `status` | ENUM `Status` | NOT NULL, default `ACTIVE` | `ACTIVE`, `COMPLETED` |
| `sort_order` | INT | NOT NULL, default `0` | Controls display order of active tasks |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-updated | Prisma `@updatedAt` |

**Indexes:** `status`, `sort_order`

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — used by `POST /api/voice/parse` |
| `NEXT_PUBLIC_APP_URL` | No | Deployed Netlify URL — available client-side |

Never commit actual values. Copy `.env.example` to `.env` and fill in locally.

---

## Prisma setup

```bash
# Install dependencies
npm install

# Copy env and add DATABASE_URL
cp .env.example .env

# Generate Prisma client (required before build)
npx prisma generate

# Create initial migration and apply to database
npx prisma migrate dev --name init

# On subsequent deploys (production)
npx prisma migrate deploy
```

The `netlify.toml` build command runs `npx prisma generate` automatically before `next build`.

---

## Rate limiting

No rate limiting is implemented at the API layer in this version. The `POST /api/voice/parse` endpoint calls the Anthropic API on every request — consider adding request-level rate limiting (e.g. via Netlify Edge Middleware) before exposing this to untrusted traffic.

---

## CORS

Next.js default CORS behaviour applies — same-origin requests only. No cross-origin access is configured or required for this single-user personal tool.
