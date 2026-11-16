# Phase 0 Research: Simple To-Do List

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-16

All technical unknowns from the plan's Technical Context are resolved below. No
`NEEDS CLARIFICATION` items remain.

## R1: Script loading model

- **Decision**: Load `app.js` as a single native ES module with
  `<script type="module" src="app.js"></script>` placed at the end of `<body>`. Serve the app
  over a static HTTP server (for example `python3 -m http.server 8000`).
- **Rationale**: The constitution requires ES module organization. ES modules run natively in
  evergreen browsers with no build step. A single module satisfies the user's three-file
  constraint, and module scope prevents accidental globals.
- **Alternatives considered**:
  - Classic `<script src="app.js">`: avoids `file://` module restrictions but violates the
    constitution's ES module requirement and leaks globals.
  - Multiple ES modules (`storage.js`, `render.js`, ...): better physical separation but
    violates the explicit three-file requirement.

## R2: File-open behavior (`file://` vs static server)

- **Decision**: Document running via a static HTTP server as the primary path. Direct `file://`
  opening may block module scripts in some browsers; it is not a supported verification path.
- **Rationale**: The constitution permits running by "opening it in a browser or serving static
  files"; a static server satisfies this with zero build tooling.
- **Alternatives considered**:
  - Classic script plus IIFE: would allow `file://`, but sacrificed ES module usage.
  - Inline module script in `index.html`: violates three-file separation of markup, style, and
    behavior.

## R3: Rendering strategy

- **Decision**: Full re-render of the `<ul>` from the in-memory `tasks` array after every
  mutation. Build each row with `document.createElement`, set `textContent` for the title, and
  set attributes explicitly.
- **Rationale**: At the target scale (≤ 500 tasks) full re-render is simple, deterministic, and
  far below the 1-second performance budget. `textContent` prevents markup injection.
- **Alternatives considered**:
  - `innerHTML` with template strings: concise but risks XSS and is prohibited for user text.
  - Keyed DOM diffing / surgical updates: unnecessary complexity for this scale.
  - Persistent DOM with event delegation on the whole app: more moving parts than needed.

## R4: Task identity generation

- **Decision**: Generate ids with `crypto.randomUUID()` when available; otherwise fall back to
  `Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)`.
- **Rationale**: Stable unique ids are required to toggle/delete individual tasks. `randomUUID`
  is native and collision-safe; the fallback covers non-secure contexts and older browsers
  without adding dependencies.
- **Alternatives considered**:
  - Array index as id: breaks when items are deleted and reordered.
  - Incrementing numeric counter: requires persisting a counter and can collide after manual
    storage edits.
  - Timestamp-only id: collides on rapid additions.

## R5: Persistence read/write and corruption recovery

- **Decision**: One storage section owns the key `todo_app_tasks`. `loadTasks()` reads the raw
  string, parses JSON in a `try/catch`, and validates that the result is an array. Each element
  is kept only if it is an object with a non-empty string `id`, a string `text`, and a boolean
  `completed`; duplicates ids after the first are dropped. A failed parse or invalid shape
  yields an empty task array and shows the storage warning. `saveTasks()` serializes the plain
  array with `JSON.stringify` inside a `try/catch`.
- **Rationale**: Guarantees corrupt or hand-edited data cannot crash startup, satisfies the
  spec's corruption edge case, and keeps the mandated value format (a bare array, no envelope).
- **Alternatives considered**:
  - Storing a versioned wrapper object: conflicts with the user-mandated array shape.
  - Trusting stored JSON: risks runtime errors and inconsistent state.
  - Throwing on invalid items: fails the "MUST open with an empty list" requirement.

## R6: Schema versioning without a stored version field

- **Decision**: Treat the current shape as schema version 1 via a `SCHEMA_VERSION = 1` constant
  and a `migrateTask()`/shape-validation seam in the storage section. No version field is
  written to storage.
- **Rationale**: Preserves the mandated `{ id, text, completed }` objects while giving future
  revisions a single place to add migration logic, satisfying the constitution's versioning
  intent. Because no earlier schema has ever shipped, no active migration branch is needed.
- **Alternatives considered**:
  - Add a `version` property to each task or a wrapper object: violates the user's explicit data
    shape.
  - No versioning seam at all: would make future migrations ad hoc.

## R7: Storage availability and failure signaling

- **Decision**: Detect failure lazily. `loadTasks()` and every `saveTasks()` call use `try/catch`.
  The first read or write failure sets `persistenceAvailable = false` and reveals a non-blocking
  status message: "Changes can't be saved in this browser, but you can keep using the list."
  No probe key is written; only `todo_app_tasks` is ever touched.
- **Rationale**: Satisfies the spec's unavailable/full-storage requirement without adding a
  second Local Storage key, which the user explicitly constrained to one.
- **Alternatives considered**:
  - Write/remove a probe key at startup: adds a second key transiently.
  - Blocking startup until storage works: contradicts "remain usable for the session".

## R8: Input normalization and validation

- **Decision**: On submit, apply `text.trim()`; if the result is empty, do nothing and keep
  focus in the input. Store the trimmed text; preserve internal whitespace. Clear the input and
  return focus after a successful add.
- **Rationale**: Matches FR-003/FR-004 and the spec's whitespace edge cases, and prevents
  accidental whitespace-only tasks.
- **Alternatives considered**:
  - Reject with an intrusive alert: noisy and not required.
  - Collapse all internal whitespace: changes user-entered titles unexpectedly.

## R9: Accessibility and interaction contract

- **Decision**: Use a real `<form>` with `<label for>` and a native submit button, a native
  checkbox inside each row's label for the task title, and a `<button type="button">` delete
  control whose accessible name includes the task title. Toggle via the list's `change` event
  and delete via the list's `click` event (event delegation). Provide `:focus-visible` outlines
  and AA contrast.
- **Rationale**: Native controls give keyboard and assistive-technology behavior for free.
  Delegation avoids re-binding listeners on each render.
- **Alternatives considered**:
  - Clickable `div` rows: inaccessible without manual ARIA and key handling.
  - Per-row listener attachment: extra work and easy to leak across re-renders.

## R10: Styling approach

- **Decision**: Plain CSS with custom properties for colors, spacing, and radii. Completed
  titles get a `.task--completed` class with `text-decoration: line-through` plus a muted
  color. System font stack only. Single responsive column with wrapping long titles
  (`overflow-wrap: anywhere`).
- **Rationale**: Satisfies the strikethrough and 320 px readability criteria with no external
  fonts or CSS frameworks.
- **Alternatives considered**:
  - Utility-class framework: forbidden by the constitution.
  - Inline styles: mixes concerns and complicates state styling.

## R11: Verification without a test framework

- **Decision**: Manual verification script in [quickstart.md](./quickstart.md) covering add
  (button + Enter), whitespace rejection, trimming, toggle/strikethrough, delete, reload
  persistence, empty state, corrupt data, unavailable storage, long/special-character titles,
  and keyboard-only operation.
- **Rationale**: The constitution prohibits test-framework dependencies; documented manual
  steps provide repeatable evidence for each success criterion.
- **Alternatives considered**:
  - Node-based test runner: requires tooling/runtime outside the browser and violates the
    dependency constraint.
  - Browser automation dependency: also prohibited as an external dependency.
