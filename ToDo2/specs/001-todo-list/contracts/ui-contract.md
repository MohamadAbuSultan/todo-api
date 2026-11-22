# Contract: User Interface and DOM

**Owner**: `index.html` markup + `app.js` render/events sections | **Style**: `style.css`
**Related**: [spec.md](../spec.md) | **Date**: 2026-11-16

This contract fixes the DOM hooks and interaction behavior so markup, styling, and script can
be verified together. IDs and classes below are part of the contract; presentation details not
listed here are free to change.

## DOM Contract

| Element | Selector | Required attributes / semantics |
|---------|----------|---------------------------------|
| Page title | `<title>` | "To-Do List" |
| Page heading | `header > h1` | "To-Do List" |
| Main region | `main` | Contains the form, warning, list, and empty state |
| Task form | `form#task-form` | Submit handler adds a task |
| Input label | `label[for="task-input"]` | Visually associated label text, e.g. "New task" |
| Task input | `input#task-input` | `type="text"`, `name="text"`, `autocomplete="off"`, `placeholder="What needs doing?"` |
| Add button | `button#add-button` | `type="submit"`, visible text "Add" |
| Storage warning | `p#storage-warning` | `role="status"`, initially `hidden` |
| Empty state | `p#empty-state` | Friendly message, visible only when the list is empty |
| Task list | `ul#task-list` | One `li` per task, in array order |
| Task row | `li.task[data-task-id]` | `data-task-id` equals the Task `id`; class `task--completed` when completed |
| Completion checkbox | `input.task-checkbox[type="checkbox"]` | `checked` iff task completed; accessible name = task text |
| Task text | `span.task-text` | Displays `text` via `textContent` only |
| Delete control | `button.task-delete[type="button"]` | Visible label "Delete"; accessible name includes the task text (e.g. `aria-label="Delete task: Buy milk"`) |

No element may use inline event-handler attributes (`onclick`, etc.).

## Interaction Contract

| User action | Resulting behavior |
|-------------|--------------------|
| Type in input and submit via Add | Trim input; if empty, create nothing and keep focus in input; otherwise append task, persist, render, clear input, keep focus in input |
| Press Enter in input | Same as activating Add (native form submit) |
| Submit whitespace-only input | No task created, no persistence write, list unchanged |
| Check a task checkbox | That task becomes completed, persisted, rendered with strikethrough; focus returns to that task's checkbox |
| Uncheck a completed checkbox | That task becomes active, persisted, strikethrough removed; focus returns to that task's checkbox |
| Click a delete button | Only that task is removed, persisted, list re-rendered; focus moves to the row at the deleted index, or the task input when the list is empty |
| Delete the last task | List empties, empty state becomes visible |
| Reload page | Tasks restored from storage with original order and completion states |

## Rendering Contract

- After every mutation the list is rebuilt from the in-memory task array.
- Titles are inserted with `textContent` (or `input.value`); `innerHTML` is never used with task
  data, and no task text is parsed as HTML.
- New tasks are appended after existing tasks.
- Each checkbox's `id` is unique and its `label`/accessible name resolves to the task text.
- Empty state is shown (`hidden` removed) exactly when `tasks.length === 0`; the `<ul>` may be
  hidden or empty at the same time, but the form and Add control remain enabled.
- The delete button's accessible name includes the task title so keyboard/screen-reader users
  can distinguish rows with identical titles.

## Visual State Contract (owned by `style.css`)

| State | Required appearance |
|-------|---------------------|
| Completed task | Title has a visible strikethrough (`text-decoration: line-through`) and a muted color; checkbox is checked |
| Active task | No strikethrough |
| Empty list | Friendly empty-state message visible, e.g. "Nothing here yet. Add your first task above." |
| Keyboard focus | Every focusable control shows a clearly visible focus indicator via `:focus-visible` |
| Long title | Wraps within the row without horizontal scrolling at 320 px viewport width |
| Storage warning | Visually distinct (not color-only) notice above the list when shown |
| Responsive width | Single vertical column; usable from 320 px upward |
| Contrast | Text and controls meet WCAG 2.1 AA contrast |
| Assets | No remote fonts, images, or styles; system font stack only |

## Accessibility Contract

- Landmark structure: `header`, `main`, list as `ul`/`li`.
- All controls reachable and operable with keyboard alone: Tab order is input → Add → per-row
  checkbox → per-row Delete.
- Native checkbox and buttons provide Enter/Space activation.
- After deleting a task, focus moves to the row that now occupies the deleted row's index: the
  following task's Delete control when one exists, otherwise the new last task's Delete control.
  Focus moves to the task input only when no tasks remain.
- After toggling completion, the list is rebuilt and focus is restored to the same task's
  checkbox, so the keyboard focus ring and the operator's position are preserved.
- Status messages use `role="status"` so they are announced without stealing focus.
- No instruction depends on color alone; completion is conveyed by both strikethrough and the
  checkbox state.

## Event Wiring Contract

| Event | Target | Handler responsibility |
|-------|--------|------------------------|
| `submit` | `#task-form` | Prevent default, validate input, add task |
| `change` | `#task-list` (delegated) | Toggle completion when target is `.task-checkbox` |
| `click` | `#task-list` (delegated) | Delete when target is `.task-delete` |

Listeners are bound once during initialization and survive re-renders (delegation).

## Contract Verification

Each row above is verifiable through the manual scenarios in
[quickstart.md](../quickstart.md), including keyboard-only operation and the 320 px check.
