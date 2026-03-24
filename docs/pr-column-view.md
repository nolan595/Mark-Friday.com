# PR: Column Grid View

## Summary

Replaces the chip-based task list layout with a Monday.com-style column grid — NAME, PRIORITY, DUE DATE, WORKLOAD — rendered as a proper tabular view with sticky column headers. Inline cell editing is introduced via a new `CellPopover` component, allowing priority, due date, and workload to be changed directly in the grid without opening the side panel. `QuickAddRow` is extended to accept all four fields at creation time, so new tasks can be fully specified inline.

## Files changed

- `components/ColumnHeader.tsx` — new: renders the sticky column header row with labels and widths
- `components/CellPopover.tsx` — new: popover for inline cell editing (priority dropdown, date picker, workload dropdown)
- `components/TaskRow.tsx` — modified: column grid layout replaces chip layout; wires up `CellPopover` per editable cell
- `components/QuickAddRow.tsx` — modified: full column grid with priority, due date, and workload inputs at creation time
- `components/TaskBoard.tsx` — modified: updated `createTask` call signature to pass new fields; `ColumnHeader` added above task list
- `app/globals.css` — modified: `popover-enter` keyframe added for `CellPopover` open animation
- `docs/design-delta.md` — new: design spec delta for the column grid feature
- `docs/qa-report.md` — appended: column grid view QA pass recorded

## Environment variables

None — no new environment variables required.

## Migration steps

None — no schema changes. The `priority`, `dueDate`, and `workload` fields already exist in the task schema. This is a pure frontend change.

## Deploy checklist

- [ ] Tests pass (53/53)
- [ ] Build passes locally
- [ ] No new environment variables required
- [ ] No database migrations required
- [ ] Verify column alignment looks correct on desktop
- [ ] Verify mobile fallback (375px): property columns hidden, chips visible below title
- [ ] Verify inline cell editing works: priority dropdown, date picker, workload dropdown
- [ ] Verify QuickAddRow submits with priority/date/workload correctly
- [ ] Verify existing task completion animation still works
- [ ] Verify drag-to-reorder still works
- [ ] Verify edit panel still opens on title click

## Rollback plan

This is a pure frontend change with no database or API surface changes. If a regression is found after deploy:

1. Go to **Netlify dashboard → Deploys**
2. Find the deploy immediately before this merge
3. Click **Publish deploy** — Netlify serves the previous build immediately, no rebuild required

No database rollback needed. No service restarts needed. No cache clearing needed beyond what Netlify handles automatically on publish.

If you need to roll back at the git level before the Netlify deploy completes:

```bash
git revert HEAD --no-edit
git push
```

This creates a clean revert commit and triggers a new Netlify deploy from the reverted state.

## QA report reference

See `docs/qa-report.md` — column grid view section appended 2026-03-24. All 53 existing tests continue to pass. No new backend tests required (no API changes).
