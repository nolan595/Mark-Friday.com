# TaskFlow — Design Delta: Grid Board View

**Version:** 1.1
**Feature:** Monday.com-style column/grid board view
**Status:** Addendum to `docs/design-spec.md`. Do not modify the spec — this document is the source of truth for this feature.

All design tokens (colours, typography, spacing, motion, border radius, accessibility) defined in `design-spec.md` remain unchanged. This document records only what is new or different.

---

## 1. Layout Change — Column Grid

The chip-based task list layout is replaced with a fixed-column grid. Every task row, the column header, and the quick-add row all share the same column template.

### Column Specification

| Column | Width | Notes |
|--------|-------|-------|
| Drag handle | 32px | `flex-shrink-0`. Hidden on mobile (`display: none` below 640px). |
| Checkbox | 40px | `flex-shrink-0`. Includes the 8px gap to the next column. |
| NAME | `flex: 1`, min-width 200px | Task title. Takes all remaining space. |
| PRIORITY | 120px | `flex-shrink-0`. |
| DUE DATE | 130px | `flex-shrink-0`. |
| WORKLOAD | 120px | `flex-shrink-0`. |
| Actions | 72px | `flex-shrink-0`. Contains note icon (if applicable) + delete button. Right-aligned. |

The column template applies identically to: the column header row, every active TaskRow, and the QuickAddRow. This alignment is structural — columns line up precisely across all three layers.

No vertical dividers between columns. Whitespace alone separates them. Horizontal dividers (`1px solid var(--color-border)`) run between rows.

### Row Heights

| Row type | Height | Change from v1 |
|----------|--------|----------------|
| Column header | 36px | New — did not exist |
| Active task row | 48px | Reduced from 56px |
| Quick-add row | 48px | Reduced from 56px (was 56px by matching task row) |
| Completed task row | 48px | Reduced from 56px |

The 8px reduction per row is intentional: the grid view communicates density through column structure rather than vertical padding. Rows become more scannable as a list, not as individual cards.

### Skeleton Update

The `TaskRowSkeleton` component in `TaskBoard.tsx` must be updated to use `h-12` (48px) instead of `h-14` (56px), and to include placeholder cells at the PRIORITY, DUE DATE, and WORKLOAD column widths rather than arbitrary widths. Skeleton cells:
- NAME: `flex-1`, height 10px, `rounded-full bg-surface-raised`
- PRIORITY: 64px wide, height 10px, `rounded-full bg-surface-raised`
- DUE DATE: 72px wide, height 10px, `rounded-full bg-surface-raised`
- WORKLOAD: 56px wide, height 10px, `rounded-full bg-surface-raised`

---

## 2. Column Header Row

### New component: `ColumnHeader`

A single-row component rendered once, immediately above the QuickAddRow and task list. It is not a section heading — it is a structural element that labels the grid columns.

**Position:** Sticky within the scroll container, below the filter bar. `position: sticky; top: 120px` (72px header + 48px filter bar). `z-index: 10`.

**Height:** 36px.

**Background:** `var(--color-surface)` — same as task rows. No border-bottom. The column labels float above the first task row with alignment as the only visual cue.

**Typography:** `label` scale — Inter 500, 0.75rem (12px), uppercase, letter-spacing 0.04em, colour `var(--color-text-muted)`.

**Column label layout:** Labels must be positioned within their respective column cells using the same column template defined above. The NAME label aligns to the left edge of the NAME column. PRIORITY, DUE DATE, WORKLOAD labels are left-aligned within their fixed-width cells.

**Column labels:**

| Column | Label text |
|--------|------------|
| NAME | NAME |
| PRIORITY | PRIORITY |
| DUE DATE | DUE DATE |
| WORKLOAD | WORKLOAD |

The drag handle and checkbox columns have no label. The actions column has no label.

**Interactivity:** None in v1. No sorting, no reordering of columns. The header is entirely non-interactive.

**Mobile:** The PRIORITY, DUE DATE, and WORKLOAD column header labels are hidden below 640px. Only NAME is shown. See Section 8 for full mobile behaviour.

**ARIA:** `role="row"` with `aria-label="Task columns"`. Each label cell has `role="columnheader"`.

---

## 3. TaskRow Changes

The existing `TaskRow` component changes in the following ways. All existing behaviour (drag-and-drop, checkbox animation, delete confirmation, edit panel trigger, ARIA) is preserved.

### Structural changes

- Row height changes from `h-14` (56px) to `h-12` (48px).
- The right-side chip cluster (`flex items-center gap-1.5 flex-shrink-0`) is replaced by three fixed-width column cells: PRIORITY (120px), DUE DATE (130px), WORKLOAD (120px).
- Each column cell is `flex-shrink-0` and aligns its content to the left edge of the cell with `pl-2` internal padding for breathing room.
- The actions column (72px) retains the note icon and delete button, right-aligned with `justify-end`.

### Cell-level inline editing

Clicking a cell value (PRIORITY, DUE DATE, or WORKLOAD) opens a small inline popover anchored to that cell — not the full edit panel. The edit panel remains the destination for notes and full editing; it can still be opened by clicking the task title (NAME column) as before.

Inline editing does not apply to the NAME column in the task row. Clicking the task title continues to open the edit panel (existing behaviour). Inline title editing is only available in the QuickAddRow name input.

**Hover affordance on editable cells:**
- On `group-hover`, cell background transitions to `var(--color-surface-raised)` using `transition-colors duration-150`.
- Cursor changes to `cursor-pointer`.
- A faint `rounded-md` background (4px radius) wraps the cell content on hover — not the full cell width, just the content bounding box.

---

## 4. New Component: `CellPopover`

A reusable positioning primitive used by all three inline edit popovers. It is not a modal — it has no overlay, does not trap focus in the full sense (Tab moves to next focusable element outside), and does not dim the board.

**Trigger:** Single click on a cell value or its dash placeholder.

**Positioning:** Anchored to the bottom-left of the triggering cell. If there is insufficient space below (within 120px of viewport bottom), it opens upward instead. Horizontal offset: 0 — left-aligned with the cell.

**Dimensions:** Width determined by content (min 160px). Max height 240px. Overflow scrollable.

**Background:** `var(--color-surface-raised)`.
**Border:** `1px solid var(--color-border)`.
**Border radius:** 8px (`rounded-lg`).
**No shadow** — consistent with the no-shadow rule in design-spec.md Section 7.

**Dismiss:** Click outside, press Escape, or select a value (discrete fields close on selection; title input closes on Enter or blur).

**Animation:** Fade in only — `opacity: 0 → 1`, duration 100ms, no transform. Fast and snappy. No slide, no scale.

```css
@keyframes popover-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.cell-popover {
  animation: popover-enter 100ms ease-out forwards;
}
```

Reduced motion: no animation — instant appearance.

**ARIA:** `role="listbox"` for option lists (PRIORITY, WORKLOAD). `role="dialog"` for the date popover. Each option is `role="option"` with `aria-selected`. The triggering cell has `aria-haspopup="listbox"` (or `"dialog"` for date) and `aria-expanded`.

**z-index:** 30 (above sticky header at z-10, above board dim overlay at z-20).

---

## 5. Priority Cell — Inline Editing

### In task rows (read state)

| Priority value | Display |
|----------------|---------|
| NONE | A dash — `—` character, `text-text-muted`, no background |
| HIGH | Existing `PriorityBadge` component — coloured pill |
| MEDIUM | Existing `PriorityBadge` component — coloured pill |
| LOW | Existing `PriorityBadge` component — coloured pill |

The `PriorityBadge` component is used as-is, unchanged. When priority is NONE, the dash renders in its place at `body-sm` scale.

### Priority popover options

Four options rendered as a vertical list inside `CellPopover`. Each option is a full-width button:

| Option | Left indicator | Label | Typography |
|--------|---------------|-------|------------|
| NONE | No indicator | None | `body-sm`, `text-text-muted` |
| HIGH | 8×8px circle, `var(--color-priority-high)` filled | High | `body-sm`, `text-text-primary` |
| MEDIUM | 8×8px circle, `var(--color-priority-med)` filled | Medium | `body-sm`, `text-text-primary` |
| LOW | 8×8px circle, `var(--color-priority-low)` filled | Low | `body-sm`, `text-text-primary` |

Currently active option shows a checkmark icon (`14×14`, `text-text-muted`) on the right edge.

Option row: height 36px, horizontal padding 12px, hover background `var(--color-border)` using `transition-colors duration-150`.

On selection: popover closes, cell updates optimistically, `PATCH /api/tasks/[id]` fires immediately (no debounce — discrete value).

---

## 6. Due Date Cell — Inline Editing

### In task rows (read state)

| State | Display |
|-------|---------|
| No date | Dash — `—`, `text-text-muted` |
| Has date | Existing `DueDateChip` component, unchanged |

### Date popover

The popover contains a single `<input type="date">` element, styled to the design system. This is the same styling pattern as the existing date input in `TaskEditPanel` — match it exactly.

Input styles:
- Background: `var(--color-surface-raised)`
- Border: `1px solid var(--color-border)`
- Border radius: 8px
- On focus: border colour `var(--color-accent)`, focus ring applied
- Text: `body-sm`, `text-text-primary`
- Height: 36px
- Padding: 0 12px

A "Clear date" text button sits below the input, visible only when a date is set. Style: `body-sm`, `text-text-muted`, hover `text-text-primary`, `transition-colors duration-150`. Clicking it sets `dueDate: null` and fires the PATCH immediately.

On date selection: popover closes, cell updates optimistically, `PATCH /api/tasks/[id]` fires immediately.

**ARIA:** Popover is `role="dialog"`, `aria-label="Set due date"`.

---

## 7. Workload Cell — Inline Editing

### In task rows (read state)

| Workload value | Display |
|----------------|---------|
| NONE | Dash — `—`, `text-text-muted` |
| LIGHT | Text "Light", `text-text-muted`, no background. Uses existing `WorkloadChip` component. |
| MEDIUM | Text "Medium", `text-text-muted`. Uses existing `WorkloadChip` component. |
| HEAVY | Text "Heavy", `text-text-muted`. Uses existing `WorkloadChip` component. |

The `WorkloadChip` component is used as-is. When workload is NONE, the dash renders in its place.

### Workload popover options

Same pattern as the priority popover. Four options as a vertical list:

| Option | Label | Typography |
|--------|-------|------------|
| NONE | None | `body-sm`, `text-text-muted` |
| LIGHT | Light | `body-sm`, `text-text-primary` |
| MEDIUM | Medium | `body-sm`, `text-text-primary` |
| HEAVY | Heavy | `body-sm`, `text-text-primary` |

Workload is not colour-coded (consistent with existing spec). No coloured dot indicator. Currently active option shows a right-aligned checkmark icon.

Option row dimensions, hover, and transition are identical to the priority popover.

On selection: popover closes, cell updates optimistically, `PATCH /api/tasks/[id]` fires immediately.

---

## 8. Enhanced QuickAddRow

The existing `QuickAddRow` component is replaced entirely. The new component spans the full column grid and accepts `priority`, `dueDate`, and `workload` inputs at creation time.

### New prop signature

```ts
interface QuickAddRowProps {
  onAdd: (payload: {
    title: string
    priority: Priority
    dueDate: string | null
    workload: Workload
  }) => void
}
```

The `createTask` function in `TaskBoard` must be updated to accept and forward this extended payload to `POST /api/tasks`.

### Default values on mount and after each submission

- `priority`: `'NONE'`
- `dueDate`: `null`
- `workload`: `'NONE'`
- `title`: `''`

After a successful submit, all four fields reset to defaults and focus returns to the NAME input.

### Column-by-column layout

**Drag handle (32px):** Empty spacer. No interactive element.

**Checkbox (40px):** A "+" icon — `16×16`, `text-text-muted`. Non-interactive; acts as a visual cue. On click, it submits the form (same as pressing Enter).

**NAME column (flex-1, min-width 200px):**
- `<input type="text">` filling the full column width
- Placeholder: "Add a task…" in `text-text-muted`
- On focus: no visible border change on the input itself — the row-level focus is communicated by a `2px solid var(--color-accent)` bottom border on the entire row, replacing the `1px solid var(--color-border)` bottom border. This is the only visual treatment on row focus.
- Press Enter to submit
- Typography: `body-md`, `text-text-primary`

**PRIORITY column (120px):**
- Default (NONE): Ghost pill — text "Priority" in `text-text-muted`, `body-sm`. No background, no border. Acts as the popover trigger.
- Selected: Renders the `PriorityBadge` component for the chosen priority. The badge is the popover trigger.
- Clicking either state opens the same `CellPopover` with priority options described in Section 5.

**DUE DATE column (130px):**
- Default (null): Text "Date" in `text-text-muted`, `body-sm`. No background, no border. Acts as the popover trigger.
- Selected: Renders the `DueDateChip` component for the chosen date. The chip is the popover trigger.
- Clicking either state opens the date popover described in Section 6.

**WORKLOAD column (120px):**
- Default (NONE): Text "Workload" in `text-text-muted`, `body-sm`. No background, no border. Acts as the popover trigger.
- Selected: Renders the `WorkloadChip` component for the chosen workload. The chip is the popover trigger.
- Clicking either state opens the same `CellPopover` with workload options described in Section 7.

**Actions column (72px):** Empty. No content in the quick-add row.

### Row visual state

- Idle: `border-b border-border bg-surface`. Identical to task rows at rest.
- When the NAME input is focused: bottom border changes to `2px solid var(--color-accent)` (replacing the `1px solid var(--color-border)`). This is a row-level signal, not an input-level focus ring.
- The standard `focus-visible` outline still applies to the individual input element for keyboard accessibility compliance.

### ARIA

- `role="form"`, `aria-label="Add a new task"`
- NAME input: `aria-label="Task name"`
- Priority trigger: `aria-label="Set priority"`, `aria-haspopup="listbox"`, `aria-expanded`
- Date trigger: `aria-label="Set due date"`, `aria-haspopup="dialog"`, `aria-expanded`
- Workload trigger: `aria-label="Set workload"`, `aria-haspopup="listbox"`, `aria-expanded`

---

## 9. TaskBoard Changes

### `createTask` signature update

The current `createTask` accepts `(title: string)`. It must be updated to accept:

```ts
createTask(payload: {
  title: string
  priority: Priority
  dueDate: string | null
  workload: Workload
})
```

The optimistic task construction and the `POST /api/tasks` body must both be updated to include the new fields. This is a minimal change — the pattern remains identical.

### QuickAddRow usage

The `<QuickAddRow onAdd={createTask} />` call changes to pass the full payload callback.

---

## 10. Mobile Behaviour (375px — below 640px breakpoint)

### Column header

Renders only the NAME label. PRIORITY, DUE DATE, WORKLOAD, and Actions labels are hidden. The drag handle and checkbox spacer columns also collapse. The result is a single visible column header: "NAME".

### Task rows

PRIORITY, DUE DATE, and WORKLOAD column cells are hidden (`display: none` below 640px). In their place, the existing chip display pattern is reinstated for mobile only:

- Below the task title (second line within the 48px row or as an overflow), chips render inline as before: `PriorityBadge` + `DueDateChip` + `WorkloadChip` — only those with values.
- If a task has no priority, no date, and no workload, no second line renders and the row remains 48px.
- If chips are present on mobile, the row expands to auto height with a minimum of 48px. The title occupies the first line; chips occupy the second line with 4px top gap.

The drag handle remains hidden on mobile (`hidden md:flex`), unchanged from v1.

### Quick-add row

The PRIORITY, DUE DATE, and WORKLOAD trigger elements are hidden below 640px. The NAME input spans the full available width (minus checkbox spacer and drag handle spacer). Submit behaviour (Enter key, "+" icon click) is unchanged.

Tasks created on mobile default to `priority: NONE`, `dueDate: null`, `workload: NONE` — the same defaults as any submission, regardless of platform.

---

## 11. Empty State

Unchanged. The `EmptyState` component renders as defined in `design-spec.md` Section 5 when `filteredTasks.length === 0`. The column header and QuickAddRow remain visible above the empty state.

---

## 12. Completed Section Rows

The `CompletedSection` component renders completed tasks using a variant of `TaskRow`. The column grid applies to completed rows as well — same column widths, same 48px height. Cells in completed rows are not inline-editable (clicking PRIORITY, DUE DATE, or WORKLOAD on a completed row does nothing). The existing completed-row visual treatment (50% opacity, strikethrough title, chips greyed to `text-muted`) remains unchanged.

---

## 13. Transition Summary

| Interaction | Transition |
|-------------|-----------|
| Cell hover (background lift) | `transition-colors duration-150` |
| Inline popover open | Fade in, 100ms, no transform — `popover-enter` keyframe |
| Inline popover close | Instant removal (no exit animation — speed matters more than elegance here) |
| Row focus bottom border | `transition-colors duration-150` |
| All other transitions | Unchanged from `design-spec.md` Section 6 |

Reduced motion: popovers appear instantly (no fade). All other reduced-motion rules from `design-spec.md` Section 10 apply.

---

## 14. Keyboard Navigation Updates

The column grid introduces new focusable elements in each row. The updated keyboard order within a single active task row is:

```
1. Drag handle button (md+ only, tabIndex -1 — reachable via keyboard DnD pattern)
2. Checkbox button
3. Title (opens edit panel)
4. PRIORITY cell trigger (opens priority popover)
5. DUE DATE cell trigger (opens date popover)
6. WORKLOAD cell trigger (opens workload popover)
7. Note icon button (if note is non-empty)
8. Delete button
```

Within an open popover:
- Tab moves through options
- Arrow keys (up/down) also navigate options
- Enter or Space selects the focused option
- Escape closes the popover and returns focus to the triggering cell

The quick-add row keyboard order:
```
1. NAME input
2. PRIORITY trigger
3. DUE DATE trigger
4. WORKLOAD trigger
```

---

*All other design tokens, components, motion specs, accessibility rules, and layout decisions remain as defined in `docs/design-spec.md`. This delta document addresses only the grid board view feature.*
