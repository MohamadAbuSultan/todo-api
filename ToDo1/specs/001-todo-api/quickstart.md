# Quickstart: Minimal To-Do API

## Prerequisites

- Node.js 18+ and npm (core API works on Node 18).
- Optional persistence requires a newer Node.js release with the experimental Web Storage flags
  (verified on Node v24.21.0).
- All commands below assume the `ToDo1/` directory as the working directory. From the repository
  root, run `cd ToDo1` once before starting; do not repeat it in the command blocks below.

## Setup

```bash
npm install
npm start
# Server listens on http://localhost:3000 (override with PORT=4000 npm start)
```

There is no build step: `npm start` runs `node src/app.js` directly.

## API Endpoints

The API is the core contract. The browser page served at `http://localhost:3000/` is an auxiliary
demo that stores its data in the browser's own localStorage and makes no API calls; it is not part
of the API contract.

### POST /todos

Create a to-do item.

**Request body**: `{ "title": "Buy groceries" }`

**Success (201)**:

```json
{ "id": "550e8400-e29b-41d4-a716-446655440000", "title": "Buy groceries" }
```

The title is trimmed. Identifiers are generated as UUID v4 values but are not validated as UUIDs on
input; duplicate titles create distinct items.

**Client errors (400)** — all use `{ "error": "message" }`:

| Cause | Message |
| --- | --- |
| Missing title | `Title is required` |
| Empty or whitespace-only title | `Title cannot be empty` |
| Title is not text | `Title must be a string` |
| JSON array used as the body | `Request body must be a JSON object` |
| Malformed JSON or JSON primitive (string/number/boolean/null) | `Invalid JSON body` |

### GET /todos

List all items in creation order.

**Success (200)**:

```json
[
  { "id": "550e8400-e29b-41d4-a716-446655440000", "title": "Buy groceries" },
  { "id": "550e8400-e29b-41d4-a716-446655440001", "title": "Walk the dog" }
]
```

Empty collection: `[]` with status 200.

### PATCH /todos/{id}

Replace an item's title. The `title` field is required; there are no partial updates and no other
fields. The id is preserved and the trimmed title is stored.

**Request body**: `{ "title": "Buy groceries and cook dinner" }`

**Success (200)**: the updated item, e.g.
`{ "id": "550e8400-e29b-41d4-a716-446655440000", "title": "Buy groceries and cook dinner" }`.

**Errors**: `400` for a missing/blank/non-text title or an invalid body (same messages as POST);
`404` with `{ "error": "Todo not found" }` for an unknown id. Title validation runs before the id
lookup, so an invalid title with an unknown id returns 400.

### DELETE /todos/{id}

Delete an item. No request body is used.

**Success (200)**: the deleted item, e.g.
`{ "id": "550e8400-e29b-41d4-a716-446655440000", "title": "Buy groceries" }`.

**Error**: `404` with `{ "error": "Todo not found" }` for an unknown id.

### Error responses for unrouted requests

Methods without a route for a path (for example `PUT /todos`, `PUT /todos/{id}`, `DELETE /todos`)
return `404` with `{ "error": "Not found" }`. The service does not return 405. Automatic `HEAD`
and `OPTIONS` responses are framework behavior and are not part of this contract.

## Persistence

By default items are held in memory only and are lost when the process restarts. Optional
persistence is provided by Node.js Web Storage and requires a Node release with the experimental
flags. Verified on Node v24.21.0:

```bash
node --experimental-webstorage --localstorage-file=/tmp/todo-api-localstorage.json src/app.js
```

Both flags are needed. With `--experimental-webstorage` alone, accessing `globalThis.localStorage`
throws; the storage adapter catches that and the service remains memory-only. Node 18 has neither
flag, so it is always memory-only. The file is created and managed by the Node runtime, not by the
application; choose a path outside version control. The feature is experimental and may emit a
warning or change in future Node releases.

Storage failures never fail an API request: corrupt stored JSON or non-array data starts from an
empty list, invalid stored entries are skipped, and write or quota failures log a warning while the
in-memory change still applies.

## Validation Scenarios

1. **Create with a valid title** — POST `{"title":"Complete project"}` → 201 with id/title; GET shows it.
2. **Create with a missing title** — POST `{}` or no body → 400 `Title is required`; nothing stored.
3. **Create with a blank title** — POST `{"title":"   "}` → 400 `Title cannot be empty`; nothing stored.
4. **Create with a non-text title** — POST `{"title":123}` → 400 `Title must be a string`.
5. **List items** — create two items; GET returns both in creation order with id/title. Empty GET → `[]`.
6. **Malformed / non-object bodies** — POST malformed JSON → 400 `Invalid JSON body`; POST `[]` → 400 `Request body must be a JSON object`; service stays available.
7. **Update** — PATCH an existing id with `{"title":"  New  "}` → 200 with trimmed title and same id; list reflects it. PATCH `{}` → 400; PATCH unknown id → 404.
8. **Delete** — DELETE an existing id → 200 with the deleted item; list no longer contains it. DELETE unknown id → 404.
9. **Unsupported methods** — PUT `/todos` → 404 `{ "error": "Not found" }`.
10. **Optional persistence** — start with both flags, POST an item, restart with the same file, GET returns it; start without the flags and restart yields `[]`.

## Validation Commands

Run from `ToDo1/`:

```bash
npm test
npm run lint
npm run format:check

# Individual suites
npm test -- tests/contract/todo.test.js
npm test -- tests/integration/todo.test.js
npm test -- tests/integration/todo-update-delete.test.js
npm test -- tests/unit/local-storage.test.js
npm test -- tests/unit/todo-service-persistence.test.js
```

Quick curl checks:

```bash
curl -X POST http://localhost:3000/todos -H 'Content-Type: application/json' -d '{"title":"Test task"}'
curl http://localhost:3000/todos
```

## API Contract Reference

See `specs/001-todo-api/contracts/todo-api.json` for the OpenAPI 3.0 definition.

## Notes

- Memory-only by default; no database, application file storage, build step, health checks,
  performance monitoring, file logging, sanitization layer, authentication, or rate limiting.
- Error responses include human-readable messages.
- The browser demo and the deployed `ToDo2` frontend are auxiliary, browser-only demos.

## Verification Record

- **Date**: 2026-11-22
- **Environment**: Node.js v24.21.0, npm 11.19.0, Linux.
- **Commands and results**:
  - `npm test` — 50 tests, 50 pass, 0 fail.
  - `npm run lint` — exit 0, no findings.
  - `npm run format:check` — exit 0, all matched files formatted.
  - Manual two-process check with `--experimental-webstorage --localstorage-file=<temp path>` —
    an item created before restart was returned by GET after restart; without the flags, data was
    empty after restart.
