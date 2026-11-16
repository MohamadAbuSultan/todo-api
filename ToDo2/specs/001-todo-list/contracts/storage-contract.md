# Contract: Local Storage Persistence

**Owner**: `app.js` storage section | **Consumer**: `app.js` domain/state sections
**Related**: [data-model.md](../data-model.md) | **Date**: 2026-11-16

This is the only interface through which the application touches browser storage. No other
module section, and no inline script, may read or write Local Storage directly.

## Storage Key

| Property | Value |
|----------|-------|
| Key name | `todo_app_tasks` |
| Additional keys | Must never be created by the application |
| Backend | `window.localStorage` |

## Value Format

- The value is a JSON array of Task objects.
- The array is stored directly (no wrapper object, no version field).
- Each Task object has exactly the persisted fields `id` (string), `text` (string), and
  `completed` (boolean). Additional properties are not written and are ignored on read.
- An empty list is stored as `[]`.
- Order of array elements is the display order.

```json
[
  { "id": "a1", "text": "Buy milk", "completed": false },
  { "id": "b2", "text": "Walk the dog", "completed": true }
]
```

## Read Contract: `loadTasks()`

1. Read the raw value of `todo_app_tasks`.
2. If the key is absent (`null`), return an empty array and do not show a warning.
3. Parse the raw value as JSON. On any parse error, return an empty array, signal unreadable
   data, and do not throw.
4. If the parsed value is not an array, return an empty array and signal unreadable data.
5. For each element, retain it only if it satisfies validation rules V3–V7 from
   [data-model.md](../data-model.md); drop later duplicate ids.
6. If any elements were dropped, keep the valid remainder and do not throw.
7. If reading storage itself throws (blocked or unavailable), return an empty array, mark
   persistence unavailable, and do not throw.
8. Return the validated array in stored order.
9. Normalization (trimming `text`, coercing nothing) is applied by validation, never by
   mutating user-visible content beyond whitespace trimming.

## Write Contract: `saveTasks(tasks)`

1. Serialize the in-memory task array with `JSON.stringify` using only the persisted fields
   `id`, `text`, and `completed`.
2. Write the resulting string to `todo_app_tasks`, replacing any previous value.
3. Return `true` on success.
4. On any write error (quota exceeded, blocked storage), return `false`, mark persistence
   unavailable, and do not throw.
5. A failed write MUST NOT roll back the in-memory state; the session continues with the change
   in memory, and the storage warning becomes visible.

## Write Triggers

A write MUST occur immediately after each of the following successful mutations, before the
event handler returns:

| Trigger | Persisted change |
|---------|------------------|
| Add task | Appended Task object with `completed: false` |
| Toggle completion | Updated `completed` value for one task |
| Delete task | Task removed from the array |

No write occurs for rejected input (empty or whitespace-only title).

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Key absent | Empty list, no warning |
| Invalid JSON | Empty list, warning: "Saved tasks couldn't be loaded, so the list started empty." |
| Parsed value not an array | Empty list, same warning as invalid JSON |
| Some invalid elements | Invalid elements dropped, valid elements retained, no warning required |
| Read throws | Empty list, persistence marked unavailable, warning: "Changes can't be saved in this browser, but you can keep using the list." |
| Write throws / quota exceeded | In-memory state kept, persistence marked unavailable, same unavailable warning |
| Subsequent successful write | Warning may be hidden again only if persistence is proven available |

## Versioning

- The current schema is version 1, tracked by a `SCHEMA_VERSION = 1` constant in code.
- The version is not stored in the payload because the user-mandated shape is a bare array.
- All future shape changes MUST add a migration step in the read contract before validation.
- Data written by any other application or schema and not matching this contract is discarded
  under the read rules above.

## Privacy

- Data never leaves the device; no storage value is logged or transmitted.
- Disposing of data is the user's action (deleting tasks or clearing browser storage).

## Contract Tests (manual, per quickstart)

1. Save two tasks, reload, observe identical array and rendered order.
2. Set the key to `not-json`, reload: empty list plus warning, no console exception.
3. Set the key to `{}`, reload: empty list plus warning.
4. Set the key to an array mixing valid and invalid objects: only valid ones render.
5. Disable storage, add a task: task appears, warning appears, app remains interactive.
