# Project Brief — Voice-First Task Manager

## What we're building

A personal task manager inspired by Monday.com, with a **voice brain dump** as the primary way to create tasks. The user clicks a mic button, speaks freely — "finish the Q3 report by Friday, that's high priority, also call the accountant next week, medium priority" — and AI parses that into structured tasks automatically. Beautiful dark UI, satisfying task completion interactions, drag-to-reorder.

Single-user personal tool. No auth, no teams, no multi-user features needed.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14** (App Router) |
| Language | **TypeScript** throughout |
| Styling | **Tailwind CSS** |
| ORM | **Prisma** |
| Database | **PostgreSQL** hosted on **Railway** |
| AI (voice parsing) | **Anthropic Claude API** (`claude-sonnet-4-6`) via Next.js API route |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Date utilities | `date-fns` |
| Deployment | **Netlify** (Next.js via `@netlify/plugin-nextjs`) |

---

## Environment variables

The following environment variables are required. Document them in `.env.example` — never hardcode values.

```
DATABASE_URL=             # Railway PostgreSQL connection string
ANTHROPIC_API_KEY=        # Anthropic API key for voice parsing
NEXT_PUBLIC_APP_URL=      # The deployed Netlify URL (e.g. https://your-app.netlify.app)
```

The actual `DATABASE_URL` value will be provided by the developer at setup time and added to Netlify environment variables and a local `.env` file. Do not generate or hardcode it.

---

## Database schema — Prisma

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Task {
  id         String    @id @default(uuid())
  title      String
  priority   Priority  @default(NONE)
  dueDate    DateTime? @map("due_date") @db.Date
  workload   Workload  @default(NONE)
  note       String?
  status     Status    @default(ACTIVE)
  sortOrder  Int       @default(0) @map("sort_order")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  @@index([status])
  @@index([sortOrder])
  @@map("tasks")
}

enum Priority {
  HIGH
  MEDIUM
  LOW
  NONE
}

enum Workload {
  LIGHT
  MEDIUM
  HEAVY
  NONE
}

enum Status {
  ACTIVE
  COMPLETED
}
```

Run `npx prisma migrate dev --name init` to create the initial migration.
Run `npx prisma generate` to generate the client.

---

## API routes — Next.js App Router

All routes live under `app/api/`. Use Prisma client server-side only. All routes return JSON.

### `GET /api/tasks`
Fetch all tasks. Returns two arrays:
```json
{
  "active": [...],
  "completed": [...]
}
```
Active tasks ordered by `sortOrder ASC` then `createdAt DESC`.
Completed tasks ordered by `updatedAt DESC` (most recently completed first).

### `POST /api/tasks`
Create a single task.
```typescript
// Request body
{ title: string, priority?: Priority, dueDate?: string, workload?: Workload, note?: string }

// Response: the created Task object
```
Auto-assign `sortOrder` as current max + 1.

### `PATCH /api/tasks/[id]`
Partial update — accepts any subset of task fields. Always updates `updatedAt`.
Used for: editing title/priority/date/workload/note, toggling status, reordering.

### `DELETE /api/tasks/[id]`
Hard delete. Returns `{ success: true }`.

### `POST /api/tasks/bulk`
Create multiple tasks in a single Prisma transaction (used after voice parsing confirmation).
```typescript
// Request body
{ tasks: Array<{ title, priority?, dueDate?, workload? }> }

// Response
{ created: Task[], count: number }
```

### `POST /api/voice/parse`
Parse a voice transcript into structured tasks using the Anthropic API.
```typescript
// Request body
{ transcript: string, currentDate: string } // currentDate: ISO string e.g. "2026-03-24"

// Response
{ tasks: Array<{ title: string, priority: Priority, dueDate: string | null, workload: Workload }> }
```

**Anthropic call — system prompt:**
```
You are a task extraction assistant. Extract every distinct task from the user's voice transcript.

For each task return:
- title: short, actionable task name (max 80 characters)
- priority: "HIGH", "MEDIUM", "LOW", or "NONE" — infer from urgency language ("urgent", "ASAP" = HIGH; "whenever" = LOW)
- dueDate: ISO date string YYYY-MM-DD if a date is mentioned, null otherwise. Today is ${currentDate}. Resolve relative dates: "today" = today, "tomorrow" = tomorrow, "this Friday" = the coming Friday, "next week" = 7 days from today, "end of month" = last day of current month.
- workload: "LIGHT", "MEDIUM", "HEAVY", or "NONE" — infer if complexity language is present

Return ONLY a valid JSON array with no preamble, markdown, or explanation.
Example output: [{"title":"Finish Q3 report","priority":"HIGH","dueDate":"2026-03-28","workload":"HEAVY"},{"title":"Call accountant","priority":"MEDIUM","dueDate":null,"workload":"LIGHT"}]

If the transcript contains nothing actionable, return an empty array: []
```

Use `anthropic.messages.create()` with model `claude-sonnet-4-6`, max_tokens 1024.
Parse the response content as JSON. If parsing fails, return a 422 with a clear error message.

---

## Frontend — pages and components

### File structure
```
app/
  layout.tsx           — root layout, loads fonts, sets dark background
  page.tsx             — main page (the entire app)
  api/
    tasks/
      route.ts         — GET + POST
      [id]/route.ts    — PATCH + DELETE
      bulk/route.ts    — POST bulk create
    voice/
      parse/route.ts   — POST voice parsing
components/
  TaskBoard.tsx        — main board, fetches and holds all task state
  TaskRow.tsx          — single active task row with all controls
  TaskEditPanel.tsx    — right slide-out edit panel
  CompletedSection.tsx — collapsible completed tasks section
  VoiceBrainDump.tsx   — mic button, recording state, waveform animation
  VoicePreviewModal.tsx — parsed tasks preview before saving
  FilterBar.tsx        — All / High / Medium / Low / Due Today filters
  PriorityBadge.tsx    — coloured priority chip
  DueDateChip.tsx      — due date with relative formatting + overdue state
  WorkloadChip.tsx     — workload indicator
lib/
  prisma.ts            — Prisma client singleton
  utils.ts             — shared helpers (cn, date formatting, etc.)
types/
  index.ts             — shared TypeScript types
```

---

## Design system

### Colours — define as Tailwind config custom colours AND CSS variables
```
background:    #0A0A0F   (page background — deepest dark)
surface:       #111118   (card/panel backgrounds)
border:        #2A2A35   (subtle borders)
text-primary:  #F0F0F5   (main text)
text-muted:    #8888A0   (secondary text, placeholders)
accent:        #6C63FF   (brand colour — buttons, focus rings, active states)
priority-high: #FF6B6B   (red-coral)
priority-med:  #FFB347   (amber)
priority-low:  #4ECDC4   (teal)
completed:     #52C788   (muted green)
danger:        #FF4D4D   (delete actions)
```

### Typography — load via `next/font/google`
- **Syne** — weights 600, 700 — used for headings, app title, section labels
- **Inter** — weights 400, 500 — used for all body text, inputs, chips

### Tailwind config
Extend the default theme with the custom colours above so they can be used as `bg-surface`, `text-accent`, `border-border`, etc.

### Component design rules
- All interactive elements get a focus ring using the accent colour
- Hover states on task rows: very subtle background lift (`bg-surface` → slightly lighter)
- No box shadows — use borders and background differences for depth
- Border radius: `rounded-lg` (8px) for cards and panels, `rounded-full` for chips and badges
- All transitions: `transition-all duration-200 ease-out`

---

## Animations and interactions — these matter a lot

### Task completion (the satisfying moment)
When the user clicks the checkbox on an active task:
1. The checkbox animates — a checkmark draws itself with a CSS stroke animation, background fills with `completed` green
2. A subtle ripple ring expands outward from the checkbox and fades
3. The task row fades to 50% opacity and slides down with a smooth 400ms transition
4. It lands in the Completed section (which auto-expands if collapsed)

Use CSS keyframes + Tailwind `animate-*` for this. Do not use a JS animation library.

### Voice recording state
The mic button in the header goes through three visual states:
- **Idle:** Static mic icon, accent colour border, subtle pulse animation (scale 1.0 → 1.05 → 1.0, 2s loop)
- **Recording:** Solid red background, three concentric rings pulse outward (`ping` animation), live transcript text appears below in italic muted text
- **Parsing:** Spinner replaces mic icon, label reads "Parsing…"

### Voice preview modal — tasks slide in
When parsed tasks arrive, a modal overlays the screen:
- Background dims with a fade
- Modal slides up from the bottom (translateY: 100% → 0, 300ms ease-out)
- Each task card appears sequentially with a staggered fade-in (50ms delay between each)
- Each task card shows: title, priority badge, due date, workload — all editable inline before confirming

### Drag reorder
Use `@dnd-kit` for dragging task rows within the active list:
- Drag handle icon visible on row hover (left edge)
- While dragging: lifted row gets a subtle border highlight and slight opacity drop on other rows
- On drop: optimistic UI update + `PATCH /api/tasks/[id]` to persist the new `sortOrder`

### Edit panel
- Slides in from the right (translateX: 100% → 0, 250ms ease-out)
- Rest of the board subtly dims to 70% opacity while panel is open
- All fields auto-save on change with a 500ms debounce — no save button
- A small "Saved" indicator flashes briefly after each auto-save

---

## Page layout

```
┌──────────────────────────────────────────────────────┐
│  HEADER                                              │
│  "TaskFlow"  (Syne, large)    [🎙 Brain dump]  CTA  │
├──────────────────────────────────────────────────────┤
│  FILTER BAR                                          │
│  [All] [High] [Medium] [Low] [Due Today]             │
├──────────────────────────────────────────────────────┤
│  ACTIVE TASKS                                (count) │
│  ┌──────────────────────────────────────────────┐   │
│  │ ⠿  ☐  Task title                 HIGH  Fri  │   │
│  │        Light · 📝                            │   │
│  └──────────────────────────────────────────────┘   │
│  ... more task rows                                  │
├──────────────────────────────────────────────────────┤
│  ▶ COMPLETED  (12)   [Clear all]                     │
│  ┌──────────────────────────────────────────────┐   │
│  │     ✓  Completed task title     ──    ──     │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Task row anatomy (active)
Left → right:
1. Drag handle (⠿ icon, visible on hover only)
2. Checkbox (animated on click)
3. Task title (click → opens edit panel)
4. Priority badge (coloured pill — hidden if NONE)
5. Due date chip (relative format: "Today", "Tomorrow", "Fri 28", "28 Mar" — red + bold if overdue)
6. Workload chip (subtle grey pill — hidden if NONE)
7. Note icon (📝 — visible only if note exists, click opens edit panel scrolled to note field)
8. Delete button (🗑 — visible on hover only, confirm before deleting)

### Completed section
- Collapsed by default, shows count in header: "COMPLETED (12)"
- Click header to expand/collapse with smooth height animation
- Completed rows: title has strikethrough, all chips greyed out, checkbox is filled green
- "Clear all" button at far right of section header (with confirmation)

### Empty state
When there are no active tasks:
- Centred illustration area (simple SVG — a clean inbox-zero style graphic)
- Heading: "Nothing on your plate"
- Subtext: "Hit the brain dump button to add tasks with your voice"
- The Brain dump button should be prominently suggested

---

## Voice brain dump — full user flow

### Step 1 — Idle
"Brain dump" button in header. Mic icon + label. Subtle pulse animation.

### Step 2 — Recording
- Click mic → browser requests microphone permission if not already granted
- Use `webkitSpeechRecognition` / `SpeechRecognition` Web Speech API
- `interimResults: true` so live transcript updates in real time below the button
- Stop recording on: second click, or 3 seconds of silence (use `onend` event + silence detection)
- Display live transcript text in a pill below the mic button as user speaks

### Step 3 — Parsing
- On stop, POST transcript + today's ISO date to `/api/voice/parse`
- Mic button shows spinner + "Parsing…"
- If transcript is empty or too short (< 5 chars), show a toast "Didn't catch that — try again"

### Step 4 — Preview modal
Display parsed tasks in a bottom-sheet modal. For each task:
- Title (editable text input)
- Priority selector (4 buttons: HIGH / MEDIUM / LOW / NONE — selected state highlighted)
- Due date input (date picker, pre-filled if AI detected one)
- Workload selector (4 buttons: LIGHT / MEDIUM / HEAVY / NONE)
- Remove button (×) to drop this task from the batch

Modal actions:
- **"Add [n] tasks"** — POST to `/api/tasks/bulk`, close modal, tasks appear in board with slide-in animation
- **"Cancel"** — dismiss modal, transcript is discarded

### Step 5 — Confirmation
On successful bulk save:
- Modal closes
- New tasks slide into the active list from the top, one by one with stagger
- A subtle success toast: "Added 3 tasks"

---

## Manual task creation

In addition to voice, allow manual creation via a quick-add row at the top of the active task list:
- A single text input: placeholder "Add a task…"
- Press Enter or click a "+" button to save
- Creates task with title only (all other fields default) — user can edit via the panel
- Input clears after submission, focus stays on input for rapid entry

---

## Error handling

- All API errors return `{ error: string }` with appropriate HTTP status
- Frontend shows a non-intrusive toast for errors (top-right, auto-dismiss 4s)
- If voice parsing returns malformed JSON from the AI, show: "Couldn't parse that — try again or add tasks manually"
- If the database is unreachable, show: "Can't connect to database — check your Railway connection"
- Optimistic UI updates on task completion and reorder — roll back with error toast if the API call fails

---

## Deployment

### Netlify configuration (`netlify.toml`)
```toml
[build]
  command = "npx prisma generate && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Required environment variables on Netlify
Set these in Netlify dashboard → Site settings → Environment variables:
- `DATABASE_URL` — the Railway PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Anthropic API key

### Prisma on Netlify
- `prisma generate` must run as part of the build command (already in `netlify.toml` above)
- The Railway Postgres database must be accessible from Netlify's build and function servers — Railway's default Postgres is publicly accessible via the proxy URL, so no additional networking config is needed
- Run migrations locally with `npx prisma migrate deploy` before first deploy

### `.env.example`
```
DATABASE_URL=postgresql://user:password@host:port/dbname
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

---

## Dev setup instructions (for docs/deployment.md)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations against Railway DB
npx prisma migrate deploy

# 5. Start dev server
npm run dev
```

---

## Quality requirements (for QA agent)

- All task CRUD operations must be tested (create, read, update, delete, bulk create)
- Voice parse endpoint must handle: normal input, empty transcript, gibberish, multi-task input, transcripts with relative dates
- The Prisma schema enums must match the API route validation exactly
- All UI components must be keyboard accessible
- Mobile viewport (375px) must be tested — layout should stack gracefully, voice button must be reachable
- The task completion animation must not cause layout shift
- Optimistic updates must roll back correctly on API failure
- TypeScript — zero `any` types, strict mode enabled

---

## Summary — what the agent team should produce

| Agent | Deliverable |
|-------|------------|
| Designer | `docs/design-spec.md` — full design system, component inventory, motion spec |
| FE/BE (same Next.js project) | Complete working app — all API routes, all UI components, Prisma schema and migration |
| QA | Tests for all API routes + key components, `docs/qa-report.md` |
| DevOps | `netlify.toml`, `.env.example`, `docs/deployment.md`, GitHub Actions CI |

The app should be fully functional on first deploy — a developer should be able to clone the repo, add the two environment variables, run the migration, and have a working app at their Netlify URL.
