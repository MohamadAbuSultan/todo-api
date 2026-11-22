# Implementation Plan: Minimal To-Do API

**Branch**: `001-todo-api` | **Date**: 2026-11-13 | **Last updated**: 2026-11-22

**Spec**: [spec.md](spec.md)

**Input**: Feature specification from `ToDo1/specs/001-todo-api/spec.md`

**Path convention**: Paths are relative to the repository root (`ToDo1/` is the backend project
root; `ToDo2/` is a separate frontend). Commands below run from `ToDo1/`.

## Summary

A minimal Node.js and Express web service implementing a To-Do API with `GET /todos`,
`POST /todos`, `PATCH /todos/{id}`, and `DELETE /todos/{id}`. Titles are validated and trimmed;
errors use a structured `{ "error": "..." }` body. Data is held in process memory by default, with
optional persistence through the runtime's Web Storage API.

## Technical Context

- **Language/Version**: Node.js 18+, CommonJS JavaScript.
- **Primary Dependencies**: `express` (includes its JSON body parser), `uuid`. No direct
  `body-parser` dependency and no additional runtime dependencies.
- **Storage**: In-memory array in `TodoService`. Optional `LocalStorageStore` adapter reads and
  writes a JSON array under the `todos` key through `globalThis.localStorage` when that runtime
  capability is available. No database and no application-managed file storage.
- **Testing**: Node.js built-in test runner (`node --test`) with `node:assert/strict`; contract,
  integration, and unit suites. No Jest.
- **Target Platform**: Node.js on any supported operating system; no Docker configuration exists.
- **Performance**: No performance targets, benchmarks, or concurrency goals are defined.
- **Constraints**: No build step (`npm run build` does not exist), no authentication, no
  application file logging, no health checks, no performance monitoring, and no sanitization layer
  beyond title validation/trimming. Two response security headers and `x-powered-by` removal are
  configured in `src/app.js`.

## Constitution Check

Checked against the root constitution at `.specify/memory/constitution.md` (v1.0.0, 2026-11-22):

- **I. Documentation Accuracy**: spec, plan, data model, contract, checklist, and quickstart were
  reconciled with the code and tests in this change set; unsupported claims were removed.
- **II. Minimal Dependencies, No Build Step**: two runtime dependencies; `node src/app.js` starts
  the service; no bundler, transpiler, database, or build script.
- **III. Tested Observable Behavior**: 50 `node --test` tests cover the documented surface;
  contract tests were extended alongside the contract itself.
- **IV. Explicit Persistence and Failure Semantics**: memory-only default and the exact optional
  runtime flags are documented; storage failures are documented as non-fatal.
- **V. API Contract Independent of Auxiliary Demos**: the browser page at `/` and the `ToDo2`
  frontend are explicitly described as separate demos with their own localStorage.

No violations identified.

## Project Structure

### Documentation (this feature)

```text
ToDo1/specs/001-todo-api/
├── spec.md                      # Observable behavior and acceptance criteria
├── plan.md                      # This file
├── data-model.md                # Entity, validation, and storage behavior
├── quickstart.md                # Setup, endpoints, scenarios, verification record
├── tasks.md                     # Task ledger with traceability and statuses
├── contracts/
│   └── todo-api.json            # OpenAPI 3.0 contract
└── checklists/
    └── requirements.md          # Spec quality and implementation alignment
```

There is no `research.md`; nothing in this feature depends on it.

### Source Code and Tests

```text
ToDo1/
├── package.json                 # Scripts: start, dev, test, lint, format, format:check
├── package-lock.json
├── public/
│   └── index.html               # Auxiliary browser demo (localStorage, no API calls)
├── src/
│   ├── app.js                   # Express app, middleware, static demo, 404/error handlers
│   ├── api/
│   │   └── todo.routes.js       # GET/POST /todos, PATCH/DELETE /todos/:id
│   ├── models/
│   │   └── todo-item.js         # Immutable TodoItem with title validation
│   ├── services/
│   │   └── todo.service.js      # Create/list/update/delete, load/persist
│   ├── storage/
│   │   └── local-storage.js     # Optional Web Storage adapter
│   └── utils/
│       └── validation.js        # Title validation and client-error helper
└── tests/
    ├── contract/todo.test.js
    ├── helpers/server.js
    ├── integration/todo.test.js
    ├── integration/todo-update-delete.test.js
    └── unit/
        ├── local-storage.test.js
        ├── todo-service-persistence.test.js
        ├── todo-service.test.js
        └── validation.test.js
```

**Structure decision**: A single backend project with clear separation between validation, model,
storage, service, and HTTP layers. No library extraction, monorepo tooling, or new architecture is
introduced.

## Complexity Tracking

No complexity violations. The optional storage adapter is a single module behind the service and
adds no dependency or build step.

## Data Model Summary

- **id**: opaque string, generated as UUID v4 by default, not UUID-validated on input, immutable.
- **title**: required text, trimmed, non-empty; also required for `PATCH`.
- Items are stored as a plain array; lookup is O(n); memory grows linearly with item count.

## API Contract Summary

- **POST /todos** — validates `title`; `201` with the created item; `400` for validation, malformed
  JSON, JSON primitives, or non-object bodies.
- **GET /todos** — `200` with the full array in creation order (`[]` when empty).
- **PATCH /todos/{id}** — `title` required; `200` with the updated item; `400` for validation or
  body errors; `404` for an unknown id.
- **DELETE /todos/{id}** — no body; `200` with the deleted item; `404` for an unknown id.
- Unrouted methods/paths (for example `PUT /todos`) return `404` with `{ "error": "Not found" }`,
  not `405`.

## Persistence & Failure Behavior

- Default: in-memory only; restarting the process discards all items.
- Optional: persistence through Node.js Web Storage requires a Node release that provides the
  experimental flags. Verified on Node v24.21.0:
  ```bash
  node --experimental-webstorage --localstorage-file=/tmp/todo-api-localstorage.json src/app.js
  ```
  Both flags are required. With `--experimental-webstorage` alone, accessing `localStorage` throws;
  `LocalStorageStore` catches that and the service stays memory-only. Node 18 has neither flag, so
  the service is memory-only there. The file is managed by Node's experimental runtime, not by the
  application.
- On load: unavailable storage, invalid JSON, or non-array data yields an empty list with a
  warning; individual invalid entries are skipped.
- On write: serialization or write failures (including quota errors) log a warning and return
  `false`; `TodoService.persist()` ignores that result, so in-memory changes stand and the API
  request still succeeds.

## Non-goals / Not Implemented

No database, no application file storage, no build step, no file logging, no health-check endpoint,
no performance monitoring, no input-sanitization layer, no authentication, no rate limiting, and no
CORS configuration. The browser page and `ToDo2` frontend are auxiliary demos, not API contracts.

## Verification

Run from `ToDo1/`: `npm test`, `npm run lint`, `npm run format:check`. See `quickstart.md` for the
scenario list, manual curl checks, and the recorded results. As of 2026-11-22: 50 tests pass, lint
is clean, and formatting is clean.
