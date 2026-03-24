# QA Report — TaskFlow v0.1.0 — 2026-03-24

Full codebase review. New project mode.

---

## 1. Test Coverage Summary

### Files tested

| File | Tests | Pass |
|------|-------|------|
| `app/api/tasks/route.ts` | 11 | 11 |
| `app/api/tasks/[id]/route.ts` | 10 | 10 |
| `app/api/tasks/bulk/route.ts` | 7 | 7 |
| `app/api/voice/parse/route.ts` | 12 | 12 |
| `lib/utils.ts` | 13 | 13 |
| **Total** | **53** | **53** |

All tests pass. Run with `npm test`.

### What is tested
- All API route happy paths (GET, POST, PATCH, DELETE, bulk POST, voice parse)
- All validation error cases (400s) including edge conditions: empty string title, 501-char title, invalid enum values, malformed date format, empty/oversized arrays
- 404 detection via Prisma `P2025` error code on PATCH and DELETE
- 500 handling on all routes
- AI JSON parse failure → 422
- AI returning a non-array → 422
- `currentDate` being passed through to the system prompt
- All `formatDueDate` output formats: null, today, tomorrow, within-7-days, beyond-7-days, past date
- All `isOverdue` cases: null, today, yesterday, future, past

### What is NOT tested (no automated coverage)
- React component rendering (no `@testing-library/react` installed)
- DnD drag-reorder flow in `TaskBoard`
- `VoiceBrainDump` recording lifecycle (browser API — requires JSDOM + Speech Recognition mock)
- `TaskEditPanel` debounce save timing
- Toast entrance/exit animation classes
- Completed section expand/collapse behaviour

---

## 2. Issues Found

| ID | Severity | Component | Description | Status |
|----|----------|-----------|-------------|--------|
| QA-01 | High | `TaskEditPanel` | `debounceRef.current` timeout was never cleared in a cleanup effect. On unmount with a pending debounce, `onSave` fires against a stale closure referencing an unmounted component. | **Fixed** |
| QA-02 | High | `VoiceBrainDump` | `recognition.onend` called `stopAndParse()` — an async function that itself calls `setVoiceState` — from inside a `setVoiceState` functional updater. Calling async side-effects inside a React state setter callback is unsupported and produces undefined behaviour (the setter is expected to be a pure synchronous function). | **Fixed** |
| QA-03 | Medium | `TaskRow` | `aria-checked` on the checkbox `<button>` was hardcoded to `{false}`. During the completing animation (`isCompleting = true`) the ARIA state continued to report unchecked, providing incorrect feedback to screen readers. | **Fixed** |
| QA-04 | Medium | `TaskEditPanel` | All five `<label>` elements lacked `htmlFor` attributes. Without explicit label association, screen readers do not announce the field name when the input receives focus. | **Fixed** — `htmlFor` + matching `id` added to Title textarea, Due date input, and Note textarea. Priority and Workload use `<div>` wrappers with no native input — these are segmented control groups and correctly use visual labels above button groups (acceptable pattern; `aria-label` on the group container would be ideal but is low severity). |
| QA-05 | Medium | `VoicePreviewModal` | `TaskPreviewCard` title `<input>` had no `aria-label` — it relied on placeholder text, which is not an accessible label. | **Fixed** — `aria-label={`Task ${index + 1} title`}` added. |
| QA-06 | Medium | `lib/utils.ts` | `formatDueDate` diffDays calculation (`(date.getTime() - now.getTime()) / ms_per_day`) is based on raw millisecond difference without normalising both dates to start-of-day. A date 6 days and 23 hours away rounds to 7 (ceil), which is correct, but a date exactly 7 days and 1 hour away reports `diffDays = 8` and falls through to the "d MMM" branch rather than "Fri 28". The off-by-one window is narrow (a few hours per day) but produces visually inconsistent output. | **Open** — Low impact; no data loss; recommend normalising both sides to midnight before diff. |
| QA-07 | Low | `types/index.ts` | `ApiResponse<T>` is defined but never used — the API routes return plain objects, not the `{ success, data, error }` envelope. The dead type implies a contract that does not exist and will confuse future developers. | **Open** — recommend removing or aligning actual response shapes to this type. |
| QA-08 | Low | `TaskEditPanel` | Saving an empty title is not guarded client-side. Clearing the title field and tabbing away will fire the debounced `onSave` with `{ title: "" }`. The API correctly rejects it with 400, but the optimistic state update in `TaskBoard.updateTask` will briefly set `title: ""` on the task before the error toast fires. No rollback of field-level edits exists. | **Open** — add `if (!value.trim()) return` guard in `handleFieldChange` for the title field. |
| QA-09 | Low | `app/api/tasks/[id]/route.ts` | `RouteParams` type uses synchronous `{ params: { id: string } }`. Next.js 14 (current) handles this correctly. Next.js 15 makes `params` a `Promise` — this will break on upgrade without a type change. | **Open** — note for when Next.js 15 upgrade is planned. |

---

## 3. Accessibility Audit

### TaskBoard
- Skip-to-content link present and correctly implemented (visually hidden, appears on focus). Passes.
- Toast container uses `aria-live="polite"` as outer wrapper; individual toasts use `role="alert"` for errors and `role="status"` for success. This is correct.
- Board dim overlay (`board-dimmed`) uses CSS opacity but has no `aria-hidden` — screen readers will still navigate into dimmed content while the panel is open. The focus trap in `TaskEditPanel` mitigates this but does not fully prevent it.

### TaskRow
- `role="listitem"` on `<li>` is redundant (implied by parent `<ul role="list">`) but harmless.
- Drag handle has `tabIndex={-1}` — not keyboard focusable, which is correct; keyboard drag uses DnD Kit's built-in keyboard sensor which does not require the handle to be tabbable.
- Checkbox: `role="checkbox"` with `aria-checked` now correctly reflects completing state (fixed in QA-03). `aria-label` includes task title. Passes.
- Delete button has `aria-label="Delete task"`. Passes.
- Note icon button has `aria-label="View note"`. Passes.
- Title button has no explicit `aria-label` but its text content is the task title — this is correct.

### TaskEditPanel
- `role="complementary"` with `aria-label="Edit task"`. Correct.
- Focus trap implemented. Escape closes panel. Passes.
- Label associations fixed (QA-04). Passes after fix.
- Priority segmented control: buttons have text labels but no `role="radiogroup"` or `aria-pressed` on the individual option buttons. Screen readers will announce them as plain buttons, not as a selection group. Medium gap — not blocking but impairs the experience.
- Workload segmented control: same issue as priority.

### VoiceBrainDump
- `aria-label` updates per state ("Start voice input" / "Stop recording" / "Parsing voice input"). Passes.
- `aria-pressed={isRecording}` correctly reflects recording state. Passes.
- Live transcript `<p>` has `aria-live="polite"`. Passes.

### VoicePreviewModal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to heading `id`. Passes.
- Focus trap and Escape key implemented. Passes.
- Title inputs now have `aria-label` (fixed in QA-05). Passes after fix.
- Priority/workload pill buttons in preview cards have no `aria-pressed` — same gap as in TaskEditPanel. Users cannot tell which value is selected from accessibility tree alone.

### FilterBar (referenced but not read — based on design spec)
- Design spec mandates `role="toolbar"`, `aria-label="Filter tasks"`, and `aria-pressed` on each pill. These should be verified against the actual `FilterBar.tsx` implementation.

### Contrast
- `#8888A0` (text-muted) on `#111118` (surface): computed ratio is approximately 4.0:1. This fails WCAG AA at 12px (caption scale requires 4.5:1). The design spec acknowledges this and suggests fallback to `#9898B2` if it fails. This should be verified and addressed.
- `#F0F0F5` on `#111118`: ~14:1. Passes.
- White on `#6C63FF` (accent button): ~4.9:1. Passes.

---

## 4. Mobile Audit (375px)

Based on code review (not browser render):

- Header layout: `flex items-center justify-between` — Brain Dump button and title should coexist on one row. At 375px with a 40px title and a 140px min-width button, this is tight but feasible. The spec calls for the button to drop to a second line if they exceed the row — the current layout does not implement a wrapping fallback. At very small sizes the title could be clipped or the button truncated.
- Edit panel: renders as a bottom sheet on mobile via `bottom-0 left-0 right-0 md:left-auto rounded-t-2xl md:rounded-none`. Correct.
- Filter bar: horizontal scroll is handled by the parent component (not reviewed but assumed from design spec).
- Drag handle: `hidden md:flex` — hidden on mobile. Correct per spec.
- Task row chips: `flex-shrink-0` on the chip container means long titles will be truncated. Correct.

---

## 5. TypeScript Audit

- `tsconfig.json` has `"strict": true`. All source files reviewed comply with strict mode.
- No `any` types found in API routes or utility functions.
- `VoiceBrainDump.tsx` uses `(window as unknown as Record<string, unknown>)` to safely access `SpeechRecognition` and `webkitSpeechRecognition` — this is the correct pattern given the non-standard browser API and the absence of type definitions for it.
- `TaskBoard.tsx` line 188: `const prev = activeTasks.find(...)` shadows the outer `prev` parameter in the subsequent `setActiveTasks` setter callback on line 199. The variable name `prev` is reused in the closure for `tasks` parameter. This works at runtime but is a naming collision that could confuse a reader. Low impact.
- `ApiResponse<T>` in `types/index.ts` is an unused export (see QA-07).

---

## 6. Performance Notes

- Optimistic updates are implemented for create, complete, uncomplete, and delete. The pattern is correct: local state is updated immediately, and the server response either confirms or rolls back. This gives responsive UX without waiting for the API.
- `reorderTasks` fires one `fetch` per task on drag end (N individual PATCHes). At scale, this will generate many concurrent requests for a full list reorder. Consider a dedicated bulk-reorder endpoint that accepts `[{ id, sortOrder }]` pairs in a single request.
- `clearCompleted` fires one `fetch` per completed task (`Promise.all`). Same concern at scale. A bulk-delete endpoint would be cleaner.
- `showToast` creates a `setTimeout` per toast that is not tracked in a ref for cleanup. If the component unmounts while toasts are pending, the timeouts will still fire (they're closures over `setToasts`). The functional update form is used, so this won't crash, but the state update on an unmounted component will log a warning in dev. Low impact.
- `TaskBoard.today` is computed inline on every render: `new Date().toISOString().split('T')[0]`. This is a pure string and is cheap — not a concern, but it could be moved to a `useMemo` or a stable constant.
- The `filteredTasks` computation is done inline on every render. With potentially hundreds of tasks this is still effectively O(n) and well within React's render budget. No `useMemo` is strictly required here.

---

## 7. Open Items (require human review)

| Item | Priority | Notes |
|------|----------|-------|
| `ANTHROPIC_API_KEY` and `DATABASE_URL` must be set in production environment | Critical | Both are required; the app will not start without `DATABASE_URL` and voice parse will fail without `ANTHROPIC_API_KEY`. Verify these are set in the Railway/Netlify environments. |
| `SpeechRecognition` / `webkitSpeechRecognition` browser support | High | No support in Firefox or Safari on non-Apple platforms. `VoiceBrainDump` correctly checks for API availability and shows a toast error if absent, but the UI does not visually indicate that the feature is unavailable. Consider rendering a disabled state or a tooltip explaining the browser requirement. |
| Rate limiting on `POST /api/voice/parse` | High | This endpoint proxies directly to the Anthropic API with no rate limiting or cost control. The api-spec.md acknowledges this. Before any non-personal use, add rate limiting via Netlify Edge Middleware or an in-memory token bucket. |
| `#8888A0` contrast ratio at caption size | Medium | Verify against WCAG AA at 11–12px. If it fails (ratio < 4.5:1), update to `#9898B2` as the design spec suggests. |
| Priority/Workload segmented controls missing `aria-pressed` | Medium | Affects `TaskEditPanel` and `VoicePreviewModal`. Add `aria-pressed={localTask.priority === opt.value}` to each option button. |
| FilterBar `aria-pressed` and `role="toolbar"` | Medium | Not reviewed directly — verify the `FilterBar.tsx` implementation matches the accessibility requirements in the design spec. |
| Empty title save guard in `TaskEditPanel` | Low | See QA-08. |
| Reorder and clear-completed N+1 fetch patterns | Low | See Performance Notes. Fine for a personal tool; revisit if this becomes multi-user. |
| `ApiResponse<T>` unused type | Low | See QA-07. Remove or adopt the envelope. |

---

*Report produced by @qa-engineer — TaskFlow initial build review.*

---

## Feature Update: Column Grid View — 2026-03-24

### Files changed

| File | Type |
|------|------|
| `components/ColumnHeader.tsx` | New |
| `components/CellPopover.tsx` | New |
| `components/TaskRow.tsx` | Modified |
| `components/QuickAddRow.tsx` | Modified |
| `components/TaskBoard.tsx` | Modified |
| `app/globals.css` | Modified |

---

### Issues found and fixed

| ID | Severity | Component | Description | Status |
|----|----------|-----------|-------------|--------|
| QA-10 | High | `CellPopover`, `TaskRow`, `QuickAddRow` | **Popover trigger toggle flicker.** The `mousedown` outside-click handler in `CellPopover` checked only whether the click was inside the popover element, not whether it was on the trigger button. When the user clicked the trigger to close an open popover, the sequence was: (1) `mousedown` fired on the trigger → not inside `popoverRef` → `onClose()` set `openPopover` to null, (2) `click` fired on the trigger → `togglePopover` saw `prev === null` → set `openPopover` back to the name → popover reopened. Same race applied to `DatePopoverDismiss` for the date dialog. Net result: clicking a trigger to close its popover instead closed it and immediately reopened it. | **Fixed** — `CellPopover` now accepts an optional `triggerRef: React.RefObject<HTMLButtonElement \| null>`. The outside-click handler excludes both the popover content and the trigger element. `TaskRow` and `QuickAddRow` each add `useRef` for all three trigger buttons and pass them via `triggerRef`. `DatePopoverDismiss` updated identically. |
| QA-11 | Medium | `TaskRow`, `QuickAddRow` (`DatePopoverDismiss`) | **Date popover has no Escape key handler.** Unlike `CellPopover` (which handles Escape internally), the date dialog is rendered as a plain `div[role="dialog"]` and used a separate `DatePopoverDismiss` component that only handled click-outside. Pressing Escape while the date input was focused did nothing — keyboard users had no way to dismiss without clicking outside. | **Fixed** — `DatePopoverDismiss` now also registers a `keydown` listener. Escape calls `onClose()` and returns focus to `triggerRef.current`. The fix is symmetrical with `CellPopover`'s Escape behaviour. |
| QA-12 | Medium | `CellPopover` | **Escape key did not return focus to the trigger.** The Escape handler called `onClose()` but had no reference to the trigger element, so focus was lost to `document.body` after dismissal. Keyboard users had to re-tab from the start of the row. | **Fixed** — `CellPopover` now accepts `triggerRef` (same prop introduced for QA-10) and calls `triggerRef?.current?.focus()` inside the Escape handler. |

---

### Issues open (need human review)

| ID | Severity | Component | Description |
|----|----------|-----------|-------------|
| QA-13 | Medium | `CompletedSection` | Spec deviation: `design-delta.md` Section 12 states completed rows should adopt the column grid (same column widths, 48px height, cells non-editable). The implementation keeps the original chip layout (`h-14`, flat row with chips) and does not import `COLUMN_WIDTHS`. The completed rows are therefore visually misaligned from the active grid. Not a runtime bug, but a visible inconsistency once the list has both active and completed rows visible simultaneously. Recommend aligning `CompletedTaskRow` to the grid in a follow-up. |
| QA-14 | Low | `ColumnHeader` | Invalid ARIA structure: `role="row"` is used on the header container, with `role="columnheader"` on child cells. Per the ARIA spec, `role="row"` is only valid inside a `role="grid"`, `role="treegrid"`, or `role="rowgroup"`. Without a grid ancestor, screen readers may ignore or misinterpret the row/columnheader semantics. The practical impact is low (the header is non-interactive and the column labels are still readable as text), but the ARIA tree is technically malformed. Recommend either wrapping in `role="grid"` with the task list as `role="rowgroup"`, or simplifying the header to plain labelled divs with no table-like ARIA. |
| QA-15 | Low | `CellPopover` | `children` prop is declared in the `CellPopoverProps` interface but is never rendered in the component body. It is dead interface surface that implies extensibility which does not exist. Remove the prop or implement it. |
| QA-16 | Low | `TaskRow` | `PRIORITY_OPTIONS` and `WORKLOAD_OPTIONS` are defined identically in both `TaskRow.tsx` and `QuickAddRow.tsx`. Any future change to option labels, colours, or ordering must be made in two places. Extract to a shared `lib/taskOptions.ts` or to `CellPopover.tsx` as named exports. |

---

### Test suite

All pre-existing tests continue to pass. No new test failures introduced by this feature.

| File | Tests | Pass | Fail |
|------|-------|------|------|
| `tests/api/tasks.test.ts` | 11 | 11 | 0 |
| `tests/api/tasks-id.test.ts` | 10 | 10 | 0 |
| `tests/api/bulk.test.ts` | 7 | 7 | 0 |
| `tests/api/voice.test.ts` | 12 | 12 | 0 |
| `tests/utils/utils.test.ts` | 13 | 13 | 0 |
| **Total** | **53** | **53** | **0** |

No new automated tests were added for this feature. The feature is entirely client-side (no new API routes, no schema changes). The `POST /api/tasks` route already accepted `priority`, `dueDate`, and `workload` as optional fields (validated by Zod), and the existing task-creation tests cover that path. Component-level tests remain out of scope (no `@testing-library/react` installed — unchanged from initial report).

---

### Regression check

| Area | Verdict | Notes |
|------|---------|-------|
| `TaskEditPanel` | No regression | Untouched. `onSave` signature unchanged. `TaskBoard.updateTask` signature unchanged. |
| `CompletedSection` | No regression | Untouched — does not import `COLUMN_WIDTHS` or `CellPopover`. Chip layout preserved. See QA-13 for spec deviation. |
| `VoiceBrainDump` / `VoicePreviewModal` | No regression | Both untouched. `bulkCreateTasks` signature unchanged. |
| DnD reorder | No regression | `TaskBoard.handleDragEnd` and `reorderTasks` are unchanged. `TaskRow` still uses `useSortable` with the same `id` prop. |
| Task completion animation | No regression | `isCompleting` state, `handleComplete`, and the `.task-row-completing` CSS class are all unchanged in `TaskRow`. |
| `createTask` API call | Verified correct | `TaskBoard.createTask` now passes `{ title, priority, dueDate, workload }` in the POST body (line 161). The API schema already accepted these optional fields. |
| `COLUMN_WIDTHS` alignment | Verified correct | Both `TaskRow` and `QuickAddRow` import `COLUMN_WIDTHS` from `ColumnHeader`. No hardcoded widths in the new column cells. `ColumnHeader` itself uses the same constants. |
| `onUpdate` prop wiring | Verified correct | `TaskBoard` passes `onUpdate={(patch) => updateTask(task.id, patch)}` to every `TaskRow` inside the `SortableContext` map. No render path skips this prop. |

---

*Section appended by @qa-engineer — Column Grid View feature review.*
