# TaskFlow — Design Specification

**Version:** 1.0
**Product:** TaskFlow — Voice-First Personal Task Manager
**Status:** Source of truth. Never modify this file. All future updates go in `docs/design-delta.md`.

---

## 1. Design Identity

### Concept & Direction

TaskFlow is a single-user personal task manager built around voice input. The aesthetic is **dark precision** — a interface that feels like a command centre: focused, calm, and highly tactile. Every interaction should feel considered. The UI never shouts. It rewards the user for completing things.

The visual language is built on deep near-black backgrounds, a restrained violet-indigo accent, and a tight typographic hierarchy that makes scanning a list of tasks effortless. The only moments of colour are semantic: priority levels, completion state, and the voice recording indicator. Everything else defers to structure and spacing.

The product is not trying to be a productivity platform. It is a personal thinking tool. The design should feel like a well-made notebook — quiet, precise, yours.

### What Makes This Memorable

- The voice-to-task workflow is the heart of the product. The recording state — pulsing rings, live transcript — must feel alive and responsive.
- Task completion is a designed moment, not a side effect. The checkbox draw, ripple, and fade sequence should be the most polished animation in the product.
- Typography does the heavy lifting. Syne's geometric character at heading level contrasts with Inter's legibility at body level. The pairing communicates "designed software", not "default app".
- No shadows. Depth is communicated entirely through background-colour steps and borders. The result is flat-but-structured — modern without being soulless.

### Typography Rationale

**Syne** is used for all headings and the app title. It has a distinctive geometric quality — slightly wide, confident, without being decorative. It signals that this is a designed product, not a template. Weights 600 and 700 only.

**Inter** is used for all body copy, inputs, chips, and data. It is the right choice here specifically because of its tabular numerals and x-height at small sizes — critical for a task list where dates, priorities, and short labels must read clearly. Weights 400 and 500 only.

> Note: The brief specifies Inter for body. This is the correct exception to the general preference against default fonts — Inter's numeric legibility and small-size rendering at 0.75rem–0.875rem is genuinely superior here. The Syne heading treatment provides the necessary visual distinctiveness at the product level.

---

## 2. Colour System

### Design Tokens — CSS Custom Properties

```css
:root {
  /* Base surfaces */
  --color-background:       #0A0A0F;
  --color-surface:          #111118;
  --color-surface-raised:   #1A1A24;
  --color-drag-active:      #1A1A28;
  --color-border:           #2A2A35;
  --color-overlay:          rgba(0, 0, 0, 0.7);

  /* Text */
  --color-text-primary:     #F0F0F5;
  --color-text-muted:       #8888A0;

  /* Brand */
  --color-accent:           #6C63FF;
  --color-focus-ring:       #6C63FF;

  /* Semantic — priority */
  --color-priority-high:    #FF6B6B;
  --color-priority-med:     #FFB347;
  --color-priority-low:     #4ECDC4;

  /* Semantic — status */
  --color-completed:        #52C788;
  --color-danger:           #FF4D4D;

  /* Semantic — standard */
  --color-success:          #52C788;
  --color-warning:          #FFB347;
  --color-error:            #FF4D4D;
  --color-info:             #6C63FF;
}
```

### Tailwind Theme Extension

```js
// tailwind.config.js — colors extension
colors: {
  background:    '#0A0A0F',
  surface:       '#111118',
  'surface-raised': '#1A1A24',
  'drag-active': '#1A1A28',
  border:        '#2A2A35',
  'text-primary':'#F0F0F5',
  'text-muted':  '#8888A0',
  accent:        '#6C63FF',
  'priority-high': '#FF6B6B',
  'priority-med':  '#FFB347',
  'priority-low':  '#4ECDC4',
  completed:     '#52C788',
  danger:        '#FF4D4D',
}
```

### Colour Usage Rules

| Token | Usage |
|-------|-------|
| `--color-background` | Page root. Never use for components. |
| `--color-surface` | Cards, panels, modal backgrounds. |
| `--color-surface-raised` | Hover states on rows, drag active highlight, focused inputs. |
| `--color-drag-active` | Background of the row currently being dragged. Slightly bluer than surface-raised to signal lift. |
| `--color-border` | All borders — row separators, input outlines, panel dividers. One value, used consistently. |
| `--color-overlay` | Behind modals and panels. Never use a lighter value. |
| `--color-accent` | The single brand colour. Buttons, focus rings, active filter pills, checkmark fill. |
| `--color-text-muted` | Timestamps, placeholder text, secondary labels, greyed-out completed chips. |
| `--color-danger` | Delete actions only. Never used for priority. |

### Surface Hierarchy

```
page (#0A0A0F)
  └── surface (#111118)          task rows, panels, modals
        └── surface-raised (#1A1A24)   hover state, drag active, input focus
```

No shadows. Step between levels is entirely colour-based.

---

## 3. Typography System

### Font Loading

Load via `next/font/google` in `app/layout.tsx`:

```ts
import { Syne, Inter } from 'next/font/google'

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-syne',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
})
```

### CSS Variables

```css
:root {
  --font-display: var(--font-syne), sans-serif;
  --font-body:    var(--font-inter), sans-serif;
}
```

### Type Scale

| Token | Family | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|--------|------|-------------|----------------|-------|
| `display-xl` | Syne | 700 | 2.5rem (40px) | 1.1 | -0.02em | App title "TaskFlow" |
| `heading-xl` | Syne | 700 | 1.5rem (24px) | 1.2 | -0.01em | Section headings, modal titles |
| `heading-lg` | Syne | 600 | 1.25rem (20px) | 1.3 | 0 | Sub-section headings |
| `heading-md` | Syne | 600 | 1rem (16px) | 1.4 | 0 | Panel field group labels |
| `body-lg` | Inter | 400 | 1rem (16px) | 1.6 | 0 | General body copy, descriptions |
| `body-md` | Inter | 400 | 0.875rem (14px) | 1.5 | 0 | Task titles, inputs, modal task cards |
| `body-sm` | Inter | 400 | 0.75rem (12px) | 1.4 | 0 | Secondary info, completed task titles |
| `label` | Inter | 500 | 0.75rem (12px) | 1 | 0.04em | Filter pills, chip labels — UPPERCASE |
| `caption` | Inter | 400 | 0.6875rem (11px) | 1.3 | 0 | Timestamps, "Saved" indicator |

### Font Weight Rules

- **Syne 700:** Display title and primary headings only. Never on body copy.
- **Syne 600:** Secondary headings, panel labels. Never on interactive controls.
- **Inter 500:** Labels, filter pills, button text. Anything uppercase uses 500.
- **Inter 400:** All other text. Task titles use 400 at body-md — the hierarchy comes from spacing and colour, not weight.

---

## 4. Spacing & Layout

### Base Unit

`4px`. All spacing values are multiples of 4.

### Spacing Scale

| Step | Value | Usage |
|------|-------|-------|
| 1 | 4px | Icon-to-text gaps, tight chip padding |
| 2 | 8px | Chip internal padding, list item vertical padding |
| 3 | 12px | Badge internal padding, input vertical padding |
| 4 | 16px | Card internal horizontal padding, filter bar gap |
| 5 | 20px | Section spacing between elements |
| 6 | 24px | Section vertical padding, mobile horizontal padding |
| 8 | 32px | Between major sections |
| 10 | 40px | Desktop horizontal page padding |
| 12 | 48px | Large vertical gaps |
| 16 | 64px | Top/bottom page padding |

### Grid System

- **Max-width:** 900px
- **Centring:** `margin: 0 auto`
- **Column system:** Single-column layout. No multi-column grid at any breakpoint.
- **Horizontal padding:** 24px mobile / 40px desktop

### Breakpoints

| Name | Min-width | Description |
|------|-----------|-------------|
| `sm` | 375px | Minimum supported — iPhone SE |
| `md` | 640px | Small tablet / landscape phone |
| `lg` | 900px | Desktop threshold — full layout |

### Fixed Dimensions

| Element | Value |
|---------|-------|
| Header height | 72px |
| Task row height | 56px |
| Edit panel width (desktop) | 380px |
| Filter bar height | 48px |
| Checkbox size | 20px |
| Priority badge height | 22px |
| Chip height (date/workload) | 22px |

### Container Padding Rules

```css
.container {
  max-width: 900px;
  margin: 0 auto;
  padding-inline: 24px;       /* mobile */
}

@media (min-width: 900px) {
  .container {
    padding-inline: 40px;
  }
}
```

### Responsive Behaviour

**Mobile (< 640px):**
- Header: TaskFlow title and Brain Dump button on same row. If title + button exceed row, Brain Dump drops to second line and becomes full-width.
- Edit panel: Full-width bottom sheet (100vw × auto height, max 90vh). Slides up from bottom rather than from the right.
- Task row: Drag handle hidden on mobile (no drag-to-reorder). Row chips can truncate with ellipsis.
- Filter bar: Horizontal scroll. No wrapping.

**Desktop (≥ 900px):**
- Edit panel slides in from the right at 380px width.
- Board content dims to 70% opacity when panel is open.
- Drag handle visible on row hover.

---

## 5. Component Inventory

### TaskRow

**Purpose:** Renders a single task in the active task list. Primary interaction surface.

**Variants:**
- `active` — default state, full opacity, full colour chips
- `completed` — strikethrough title, all chips greyed to `text-muted`, checkbox filled green, row at 50% opacity

**States:**

| State | Visual |
|-------|--------|
| Default | Background `surface`, full opacity |
| Hover | Background transitions to `surface-raised` (200ms), drag handle and delete button become visible |
| Focus (keyboard) | 2px solid `accent` focus ring, offset 2px, on the row or the focused child element |
| Dragging | Background `drag-active`, border 1px solid `accent` at 40% opacity, slight opacity drop on all other rows |
| Completing | Checkbox animation fires, row fades and slides — see Motion Specification |
| Disabled | Not applicable — rows are always interactive |

**Key Props:** `task: Task`, `onComplete`, `onDelete`, `onOpenPanel`, `isDragging`

**Anatomy (left to right):**
1. Drag handle — `GripVertical` icon, 16×16, `text-muted`, visible only on hover
2. Checkbox — 20×20, `rounded-full`, border `border` colour, fills `completed` on click
3. Task title — `body-md`, `text-primary`, click target for opening edit panel
4. Priority badge — hidden when `NONE`
5. Due date chip — hidden when no date set
6. Workload chip — hidden when `NONE`
7. Note icon — `FileText` icon, 14×14, `text-muted`, visible only if `note` is non-empty
8. Delete button — `Trash2` icon, 14×14, `danger` colour, visible only on hover, requires confirmation

**ARIA:** `role="listitem"`, checkbox has `role="checkbox"` and `aria-checked`, delete button has `aria-label="Delete task"`.

---

### TaskEditPanel

**Purpose:** Slide-out detail panel for editing all fields of a task. Opens when the user clicks a task title.

**Variants:** None — single layout.

**States:**

| State | Visual |
|-------|--------|
| Closed | Off-screen right (translateX 100%) |
| Open | Slides in to translateX(0), board dims to 70% opacity |
| Auto-saving | "Saved" caption flashes briefly below the last edited field |
| Field focus | Input border changes to `accent`, focus ring applied |

**Fields:**
- Title — text input, `body-md`, full width
- Priority — segmented control: 4 options (HIGH / MEDIUM / LOW / NONE), colour-coded
- Due date — `<input type="date">`, styled to match design system
- Workload — segmented control: 4 options (LIGHT / MEDIUM / HEAVY / NONE)
- Note — `<textarea>`, min-height 80px, grows to content

**Behaviour:**
- All fields auto-save on change with 500ms debounce
- No save button
- Close button (`X`) top right
- Clicking the dimmed board area also closes the panel

**ARIA:** `role="complementary"`, `aria-label="Edit task"`, close button has `aria-label="Close panel"`. Trap focus within panel while open.

---

### CompletedSection

**Purpose:** Collapsible section showing all completed tasks below the active list.

**Variants:** `collapsed` / `expanded`

**States:**

| State | Visual |
|-------|--------|
| Collapsed | Header row only: "COMPLETED (n)" label + expand chevron |
| Expanded | Header + list of completed TaskRows, height animates open |

**Key Props:** `tasks: Task[]`, `onUncomplete`, `onDelete`, `onClearAll`

**Behaviour:**
- Collapsed by default
- Auto-expands when a task is completed (user should see where their task went)
- "Clear all" button right-aligned in header, shows a confirmation inline before executing
- Smooth height transition on expand/collapse (CSS `grid-template-rows` animation: `0fr` → `1fr`)

**ARIA:** Header button has `aria-expanded`, `aria-controls` pointing to the task list id.

---

### VoiceBrainDump

**Purpose:** The mic button in the header. Manages the full recording lifecycle.

**Variants / States:**

| State | Visual | Behaviour |
|-------|--------|-----------|
| `idle` | Mic icon, `accent` border ring, subtle pulse animation | Click starts recording |
| `recording` | Solid red background, three concentric rings pulse outward, live transcript below in `caption` italic `text-muted` | Click stops recording. 3s silence auto-stops. |
| `parsing` | Spinner replaces mic icon, label "Parsing…" | Non-interactive until complete |

**Key Props:** `onTasksParsed: (tasks: ParsedTask[]) => void`

**Behaviour:**
- Uses `webkitSpeechRecognition` / `SpeechRecognition`
- `interimResults: true` for real-time transcript display
- On stop: if transcript < 5 chars, shows error toast and returns to idle
- Otherwise: POSTs to `/api/voice/parse`, transitions to parsing state
- On response: calls `onTasksParsed` and transitions back to idle

**ARIA:** Button has `aria-label` that updates per state: "Start voice input" / "Stop recording" / "Parsing voice input". `aria-pressed` reflects recording state.

---

### VoicePreviewModal

**Purpose:** Modal overlay displaying parsed tasks for review and editing before saving.

**Variants:** None — single layout.

**States:**

| State | Visual |
|-------|--------|
| Entering | Background dims, modal slides up from bottom |
| Ready | Task cards stagger-fade in sequentially |
| Saving | "Add n tasks" button shows spinner, task cards non-interactive |
| Error | Button returns to active state, error toast shown |

**Structure:**
- Overlay: full-screen, `overlay` background colour
- Modal panel: `surface` background, `rounded-lg` top corners only (bottom sheet), max 90vh, scrollable
- Header: "Review tasks" heading + count + Cancel button
- Task card list: staggered fade-in
- Footer: "Add n tasks" CTA button (accent filled) + Cancel text button

**Each task card contains:**
- Editable title input (`body-md`)
- Priority selector (four pill buttons: HIGH / MEDIUM / LOW / NONE)
- Due date input
- Workload selector (four pill buttons)
- Remove button (×) top right of card

**ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal heading. Focus trapped inside. On open, focus moves to first input. Escape key closes.

---

### FilterBar

**Purpose:** Horizontal row of filter pills below the header for filtering the active task list.

**Variants:** One pill is always active.

**Filters:** All | High | Medium | Low | Due Today

**States:**

| State | Visual |
|-------|--------|
| Default | `surface` background, `border` border, `text-muted` label |
| Active | `accent` background, white label, no border |
| Hover | `surface-raised` background (when not active) |
| Focus | Focus ring |

**Behaviour:** Stateless display. Active filter is controlled by parent. Clicking a pill updates the filter. "All" always resets to unfiltered.

**ARIA:** `role="toolbar"`, each pill is a `<button>` with `aria-pressed`. Active pill has `aria-pressed="true"`.

---

### PriorityBadge

**Purpose:** Coloured pill showing task priority. Hidden when priority is NONE.

**Variants:** `HIGH` | `MEDIUM` | `LOW` | `NONE` (renders null)

| Variant | Background | Text colour | Label |
|---------|------------|-------------|-------|
| HIGH | `priority-high` at 15% opacity | `priority-high` | HIGH |
| MEDIUM | `priority-med` at 15% opacity | `priority-med` | MED |
| LOW | `priority-low` at 15% opacity | `priority-low` | LOW |

**Typography:** `label` scale (Inter 500, 0.75rem, uppercase, 0.04em letter-spacing)
**Shape:** `rounded-full`, height 22px, horizontal padding 8px
**Key Props:** `priority: Priority`

---

### DueDateChip

**Purpose:** Shows due date in a human-readable relative format. Hidden when no date is set.

**Variants:** `normal` | `today` | `overdue`

| Variant | Condition | Text colour | Background |
|---------|-----------|-------------|------------|
| `normal` | Due in future (not today) | `text-muted` | Transparent |
| `today` | Due today | `priority-med` (amber) | `priority-med` at 10% opacity |
| `overdue` | Past due date | `priority-high` (red) | `priority-high` at 10% opacity, **bold** |

**Date formatting logic:**
- Today → "Today"
- Tomorrow → "Tomorrow"
- Within 7 days → short weekday + date, e.g. "Fri 28"
- Beyond 7 days → "28 Mar"
- Past → date + visual overdue treatment

**Typography:** `body-sm` for normal/today, `body-sm` weight 500 for overdue
**Shape:** Chip with `rounded-full`, height 22px, horizontal padding 8px
**Key Props:** `dueDate: Date`, `today: Date`

---

### WorkloadChip

**Purpose:** Shows task workload as a subtle label. Hidden when workload is NONE.

**Variants:** `LIGHT` | `MEDIUM` | `HEAVY`

All variants use the same style: `text-muted`, no background, no border. Workload label only. The visual distinction between workload levels is the text label alone — workload is not colour-coded (priority already uses colour).

**Typography:** `body-sm`, `text-muted`
**Key Props:** `workload: Workload`
**Labels:** Light | Medium | Heavy

---

### EmptyState

**Purpose:** Displayed when there are zero active tasks.

**Variants:** None — single layout.

**Structure:**
- Centred in the task list area
- SVG illustration: minimalist inbox/checkmark graphic, monochrome using `border` and `text-muted` tones
- Heading: "Nothing on your plate" — `heading-lg`, `text-primary`
- Subtext: "Hit the brain dump button to add tasks with your voice" — `body-md`, `text-muted`
- No additional CTA button in the empty state itself — the header Brain Dump button is the intended action

**Spacing:** Vertical padding 64px top and bottom within the empty area.

---

### Toast

**Purpose:** Non-intrusive notification for success, error, and info states.

**Variants:** `success` | `error` | `info`

| Variant | Left border / icon colour |
|---------|--------------------------|
| `success` | `completed` green |
| `error` | `danger` red |
| `info` | `accent` violet |

**Position:** Top-right, 16px from top and right edge. Stacks vertically if multiple toasts.
**Auto-dismiss:** 4 seconds. Manual dismiss via × button.
**Entrance:** Slides in from right (translateX 100% → 0, 200ms ease-out)
**Exit:** Fades out (opacity 1 → 0, 150ms)
**Shape:** `rounded-lg`, `surface-raised` background, `border` border, 4px left border in variant colour
**Typography:** `body-sm`, `text-primary` for message
**Max width:** 320px

**ARIA:** `role="alert"` for errors, `role="status"` for success/info. `aria-live="polite"` on the toast container.

---

### QuickAddRow

**Purpose:** Inline text input at the top of the active task list for rapid manual task entry.

**Variants:** `idle` | `focused`

**States:**

| State | Visual |
|-------|--------|
| Idle | Placeholder "Add a task…", `text-muted` placeholder colour, border `border` |
| Focused | Border changes to `accent`, background `surface-raised` |
| Filled | Shows a "+" button or pressing Enter submits |

**Behaviour:**
- Press Enter or click "+" to submit
- Creates task with title only, all other fields default
- Input clears on submit, focus remains on input
- Does not open edit panel on submit — user adds the next task immediately

**Layout:** Full width of task list. Height matches task row (56px). Left-padded to align with task title column (skipping drag handle and checkbox space).

**ARIA:** `role="form"`, input has `aria-label="Add a task"`, submit button has `aria-label="Add task"`.

---

## 6. Motion Specification

All animations must respect `prefers-reduced-motion`. When reduced motion is preferred, replace all transitions with instant state changes (opacity only where appropriate — no movement).

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### task-complete

The most important animation in the product. Triggered when a user checks a task.

**Phase 1 — Checkbox (0–300ms):**
- Checkmark path draws itself: `stroke-dasharray` + `stroke-dashoffset` animation, 0.3s ease-out
- Checkbox background fills from white to `completed` green simultaneously

**Phase 2 — Ripple (50–350ms, slight overlap):**
- A ring element (position absolute, same centre as checkbox) expands from scale(0) to scale(3)
- Opacity fades from 0.4 to 0 over the same duration
- Colour: `completed` green

**Phase 3 — Row (300–700ms):**
- Row opacity transitions from 1 to 0.5 (400ms ease-out)
- Row slides down to its position in the completed section

```css
@keyframes checkmark-draw {
  from { stroke-dashoffset: 24; }
  to   { stroke-dashoffset: 0; }
}

@keyframes ripple-expand {
  from { transform: scale(0); opacity: 0.4; }
  to   { transform: scale(3); opacity: 0; }
}

.checkbox-checkmark {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: checkmark-draw 0.3s ease-out forwards;
}

.checkbox-ripple {
  animation: ripple-expand 0.3s ease-out forwards;
  animation-delay: 50ms;
}

.task-row-completing {
  transition: opacity 400ms ease-out;
  opacity: 0.5;
}
```

---

### voice-pulse

Idle state animation on the Brain Dump button.

```css
@keyframes voice-pulse {
  0%, 100% { transform: scale(1.0); }
  50%       { transform: scale(1.05); }
}

.voice-idle {
  animation: voice-pulse 2s ease-in-out infinite;
}
```

---

### voice-ring

Recording state. Three concentric rings ping outward from the mic button.

```css
@keyframes voice-ring-ping {
  0%   { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.2); opacity: 0; }
}

.voice-ring-1 { animation: voice-ring-ping 1.5s ease-out infinite; }
.voice-ring-2 { animation: voice-ring-ping 1.5s ease-out infinite; animation-delay: 200ms; }
.voice-ring-3 { animation: voice-ring-ping 1.5s ease-out infinite; animation-delay: 400ms; }
```

All rings are position absolute, centred on the button, border only (no fill), `danger` red colour.

---

### modal-slide

Voice preview modal entrance.

```css
@keyframes modal-slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.modal-enter {
  animation: modal-slide-up 300ms ease-out forwards;
}
```

Background overlay fades in separately: opacity 0 → 1, 200ms ease-out.

---

### task-stagger

Task cards appearing inside the voice preview modal.

```css
@keyframes task-card-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Applied per card with inline animation-delay: n * 50ms */
.task-card {
  animation: task-card-enter 250ms ease-out forwards;
  opacity: 0;
}
```

---

### panel-slide

Edit panel entrance from the right.

```css
@keyframes panel-slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.panel-enter {
  animation: panel-slide-in 250ms ease-out forwards;
}
```

---

### board-dim

Board content dimming when edit panel is open.

```css
.board-dimmed {
  transition: opacity 250ms ease-out;
  opacity: 0.7;
}

.board-normal {
  transition: opacity 250ms ease-out;
  opacity: 1;
}
```

---

### saved-flash

"Saved" indicator after auto-save in edit panel.

```css
@keyframes saved-flash {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}

.saved-indicator {
  animation: saved-flash 1.5s ease-in-out forwards;
}
```

---

### task-enter

New tasks appearing in the active list after bulk save from voice.

```css
@keyframes task-enter {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Applied per row with inline animation-delay: n * 80ms */
.task-new {
  animation: task-enter 300ms ease-out forwards;
  opacity: 0;
}
```

---

### completed-section-expand

Smooth height reveal for the completed section.

```css
.completed-list {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}

.completed-list.expanded {
  grid-template-rows: 1fr;
}

.completed-list-inner {
  overflow: hidden;
}
```

---

### General Transition Defaults

All interactive elements that are not listed above use:

```css
transition: all 200ms ease-out;
```

Applied via Tailwind: `transition-all duration-200 ease-out`

---

## 7. Border Radius & Depth

### Border Radius

| Element type | Value | Tailwind class |
|-------------|-------|----------------|
| Cards, panels, modals, inputs | 8px | `rounded-lg` |
| Chips, badges, pills, buttons | 9999px | `rounded-full` |
| Checkboxes | 50% | `rounded-full` |
| Toast | 8px | `rounded-lg` |
| Focus ring | Inherits from element | — |

### Depth Without Shadows

No `box-shadow` anywhere in the product. Depth is expressed through:

1. **Background colour steps:** page → surface → surface-raised (each step is lighter)
2. **Borders:** `1px solid var(--color-border)` on cards and panels
3. **The edit panel** has a left border `1px solid var(--color-border)` as its only visual separation from the board

This creates a flat-but-structured aesthetic consistent with the design direction.

---

## 8. Interactive States

### Focus Ring

Applied to all keyboard-focusable elements.

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

Tailwind: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`

Do not suppress `:focus` — only use `:focus-visible` so keyboard users see the ring but mouse users do not.

### Hover States

| Element | Hover behaviour |
|---------|----------------|
| Task row | Background `surface` → `surface-raised`, 200ms |
| Filter pill | Background `surface` → `surface-raised`, 200ms |
| Button (primary) | Brightness increase ~10%, 200ms |
| Button (ghost/text) | `text-muted` → `text-primary`, 200ms |
| Delete button | `text-muted` → `danger`, 200ms |

### Active / Pressed States

Scale: `scale(0.97)` on press, 100ms ease-out. Applied to all `<button>` elements.

---

## 9. Page Layout

### Full Layout Structure

```
┌─────────────────────────────────────────── max-width: 900px ─┐
│                                                               │
│  HEADER (72px)                                                │
│  ├── TaskFlow wordmark (display-xl, Syne 700)                 │
│  └── Brain Dump button (accent filled, mic icon + label)      │
│                                                               │
│  FILTER BAR (48px)                                            │
│  └── [All] [High] [Medium] [Low] [Due Today]                  │
│                                                               │
│  ACTIVE TASKS SECTION                                         │
│  ├── Section header: "Tasks" label + count                    │
│  ├── QuickAddRow                                              │
│  ├── TaskRow × n (or EmptyState if count = 0)                 │
│  └── (drag-to-reorder within this list)                       │
│                                                               │
│  COMPLETED SECTION                                            │
│  ├── Section header: "COMPLETED (n)" + Clear all              │
│  └── Collapsible TaskRow × n (completed variant)              │
│                                                               │
└───────────────────────────────────────────────────────────────┘

                                         ┌── EDIT PANEL (380px) ─┐
                                         │  ×  Edit task         │
                                         │  ─────────────────    │
                                         │  Title input          │
                                         │  Priority selector    │
                                         │  Due date input       │
                                         │  Workload selector    │
                                         │  Note textarea        │
                                         │                       │
                                         │  caption: Saved ✓     │
                                         └───────────────────────┘
```

### Header

- Height 72px
- Background `surface`, bottom border `1px solid border`
- Left: TaskFlow wordmark in `display-xl`
- Right: Brain Dump button — `rounded-full`, `accent` background, white text and icon, min-width 140px
- Sticky at top on scroll

### Filter Bar

- Height 48px
- Background `background` (same as page — no distinction)
- Top border `1px solid border` to separate from header
- Pills scroll horizontally on mobile with no wrapping

### Active Tasks Section

- Section header: `label` typography, `text-muted`, with task count badge `body-sm` `text-muted`
- QuickAddRow directly below section header
- Tasks listed with no additional decoration between rows — implicit separation by row hover state

### Empty State

- Replaces the task list only (QuickAddRow and section header remain)
- Centred, 64px vertical padding

### Completed Section

- Default collapsed
- Section header matches active section style with collapse chevron
- "Clear all" button: `body-sm`, `text-muted`, right-aligned, turns `danger` on hover
- Auto-expands when a task is completed

### Edit Panel (desktop)

- Fixed to right edge of viewport, full viewport height
- Width 380px
- Background `surface`
- Left border `1px solid border`
- Overlaps the board (position fixed), board dims behind it
- Scrollable if content exceeds viewport height

### Edit Panel (mobile — bottom sheet)

- Position fixed to bottom of viewport
- Width 100vw
- Max height 90vh, scrollable
- `rounded-lg` top left and top right corners
- Slides up from bottom
- Background `surface`
- Overlay behind it

---

## 10. Accessibility

### Contrast Requirements (WCAG AA)

| Pairing | Background | Foreground | Min ratio required | Notes |
|---------|------------|------------|-------------------|-------|
| Body text on surface | `#111118` | `#F0F0F5` | 4.5:1 | Passes at ~14:1 |
| Muted text on surface | `#111118` | `#8888A0` | 4.5:1 | Verify at small sizes — use `text-primary` if contrast fails |
| Accent on background | `#0A0A0F` | `#6C63FF` | 3:1 (large text) | Accent used for large UI elements only — verify for body-sized use |
| Priority-high on badge bg | `rgba(FF6B6B,0.15)` | `#FF6B6B` | 3:1 | Badge is UI component, not body text — meets non-text contrast |
| White on accent button | `#6C63FF` | `#FFFFFF` | 4.5:1 | Passes |
| Danger text | any dark bg | `#FF4D4D` | 3:1 | Used at large size (icon + label) |

> Note: `#8888A0` on `#111118` should be verified with a contrast checker at 12px (caption size). If it fails AA at that size, increase to `#9898B2`.

### Keyboard Navigation Order

```
1. Skip-to-content link (visually hidden, appears on focus)
2. Header — Brain Dump button
3. Filter bar pills (left to right)
4. Quick add input → Quick add submit button
5. Task rows (top to bottom):
   a. Checkbox
   b. Title (opens edit panel)
   c. Note icon (if present)
   d. Delete button
6. Completed section toggle button
7. Completed task rows (when expanded)
8. Clear all button
```

Edit panel focus is trapped when open. Escape closes it and returns focus to the task row that opened it.

### ARIA Patterns

| Component | ARIA pattern |
|-----------|-------------|
| Task list | `role="list"` on the list container, `role="listitem"` on each row |
| Checkbox | `role="checkbox"`, `aria-checked`, `aria-label` with task title |
| Filter bar | `role="toolbar"`, `aria-label="Filter tasks"` |
| Filter pills | `<button>` with `aria-pressed` |
| Edit panel | `role="complementary"`, `aria-label="Edit task"`, focus trap |
| Voice preview modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Toast container | `aria-live="polite"` (success/info) or `aria-live="assertive"` (error) |
| Completed section toggle | `<button>` with `aria-expanded`, `aria-controls` |
| Brain Dump button | `aria-label` updates per state, `aria-pressed` during recording |
| Delete confirm | `aria-live="polite"` on the confirmation message |

### Reduced Motion

All animations defined in Section 6 must have `prefers-reduced-motion` alternatives:

| Animation | Reduced motion alternative |
|-----------|--------------------------|
| task-complete (slide) | Instant opacity change, no position movement |
| modal-slide | Instant appear, no transform |
| panel-slide | Instant appear, no transform |
| task-stagger | All cards appear simultaneously, no delay |
| task-enter | Instant appear |
| board-dim | Instant opacity change |
| voice-pulse | No animation — static state |
| voice-ring | No animation — static recording indicator |
| completed-section-expand | Instant expand/collapse |

The checkmark draw and ripple animations may remain as they provide important completion feedback — reduce duration to 100ms rather than eliminating.

---

*End of design specification. Do not modify this file. All future additions go in `docs/design-delta.md`.*
