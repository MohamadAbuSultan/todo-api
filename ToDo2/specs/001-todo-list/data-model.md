# Phase 1 Data Model: Simple To-Do List

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-16

## Entity: Task

Represents one to-do item in the single user's list.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | string | Yes | Non-empty, unique within the list, generated at creation, never changed |
| `text` | string | Yes | Non-empty after leading/trailing whitespace removal; stored trimmed; may contain any characters including `<`, `>`, `&`, emoji; no maximum imposed |
| `completed` | boolean | Yes | `false` at creation; toggled only through the completion action |

No other fields are persisted. In particular, no `version`, `createdAt`, `order`, or UI state is
stored, preserving the user-mandated object shape.

### Example Task

```json
{
  "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
  "text": "Buy milk",
  "completed": false
}
```

## Entity: Task List

The ordered collection of all tasks for the single local user.

- Represented as a JavaScript array of Task objects.
- Array order **is** display order (oldest first, newest appended last).
- May be empty; an empty list triggers the empty-state message.
- Contains no duplicate `id` values.
- Persisted as the entire JSON array under the Local Storage key `todo_app_tasks`.

### Example Persisted Value

```json
[
  { "id": "a1", "text": "Buy milk", "completed": false },
  { "id": "b2", "text": "Walk the dog", "completed": true }
]
```

## Validation Rules

| Rule | Applies to | Behavior on failure |
|------|------------|---------------------|
| V1: Stored value must parse as JSON | Whole list | Treat as empty list; show storage warning; do not crash |
| V2: Parsed value must be an array | Whole list | Treat as empty list; show storage warning |
| V3: Each element must be a non-null object | Task | Drop the invalid element, keep valid ones |
| V4: `id` must be a non-empty string | Task | Drop the invalid element |
| V5: `id` must be unique within the list | Task | Drop later duplicates, keep the first |
| V6: `text` must be a string and non-empty after trimming | Task | Drop the invalid element |
| V7: `completed` must be a boolean | Task | Drop the invalid element |
| V8: Submitted title must be non-empty after trimming | New task input | Create no task; leave list unchanged; keep input available |

Validation failures never throw to the user. Dropped-element recovery preserves as much valid
data as possible; a fully invalid payload degrades to the empty state.

## State Transitions

### Task lifecycle

```text
(none) --add(valid title)--> Active
Active --toggle--> Completed
Completed --toggle--> Active
Active --delete--> (removed)
Completed --delete--> (removed)
```

- **Add**: Creates a new Active task with a fresh unique `id`, trimmed `text`, and
  `completed: false`, appended to the end of the list.
- **Toggle**: Flips `completed` on exactly one task identified by `id`; no other task changes.
- **Delete**: Removes exactly one task identified by `id`; relative order of remaining tasks is
  unchanged.
- **Completed**: Rendered with strikethrough on the title; the task remains toggleable and
  deletable.

### Persistence lifecycle

```text
App start --read todo_app_tasks--> parse --validate--> in-memory list --> render
Any mutation --mutate in memory--> render --> write JSON array to todo_app_tasks
Write failure --> keep in-memory list --> set persistenceUnavailable --> show warning
Reload --> repeat start path (in-memory changes since failure are lost, as warned)
```

## Derived View State

These values are computed, never persisted:

| Derived value | Source | Purpose |
|---------------|--------|---------|
| `isEmpty` | `tasks.length === 0` | Show/hide the empty-state message |
| `persistenceUnavailable` | First storage read/write failure | Show/hide the storage warning |
| Task count | `tasks.length` | Available for status text if displayed |

## Invariants

1. Every rendered row corresponds to exactly one task in the in-memory list.
2. Every task in memory satisfies V3–V7 before it is rendered.
3. The rendered list order always equals the in-memory array order.
4. After a successful mutation, the persisted JSON array equals the in-memory array.
5. No user-supplied text is ever interpreted as markup.
