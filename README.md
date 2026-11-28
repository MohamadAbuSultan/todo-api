# To-Do Application

## 🚀 Live Demo

Check out the live demo here:
👉 **[View Live Site](https://mohamadabusultan.github.io/todo-api/)**

This demo is the **frontend only**: it is the static `ToDo2/` app deployed via GitHub Pages, which
runs entirely in the browser and does not call the backend API. The `ToDo1/` backend is not
deployed. See [Backend (ToDo1)](#backend-todo1) for local API setup.

---

### Overview
- **ToDo2 (Frontend)**: Lightweight To-Do web app deployed via GitHub Pages.
- **ToDo1 (Backend)**: REST API built with Node.js and Express.

## Backend (ToDo1)

The backend is a small Node.js/Express REST API in `ToDo1/`. Its behavior is specified in
[`ToDo1/specs/001-todo-api/spec.md`](ToDo1/specs/001-todo-api/spec.md), with an OpenAPI contract in
[`ToDo1/specs/001-todo-api/contracts/todo-api.json`](ToDo1/specs/001-todo-api/contracts/todo-api.json)
and runnable scenarios in [`quickstart.md`](ToDo1/specs/001-todo-api/quickstart.md).

### Setup and run

```bash
cd ToDo1
npm install
npm start              # http://localhost:3000
PORT=4000 npm start    # optional port override
```

There is no build step: `npm start` runs `node src/app.js` directly.

### Tests and checks

```bash
cd ToDo1
npm test
npm run lint
npm run format:check
```

### Endpoint summary

| Method | Path | Success | Error cases |
| --- | --- | --- | --- |
| GET | `/todos` | 200 — array in creation order (`[]` when empty) | — |
| POST | `/todos` | 201 — created `{ "id", "title" }` | 400 for missing, blank, or non-text title; malformed JSON; JSON primitive; non-object body |
| PATCH | `/todos/{id}` | 200 — updated `{ "id", "title" }` (title is required, id preserved) | 400 for invalid title or body; 404 for unknown id |
| DELETE | `/todos/{id}` | 200 — the deleted `{ "id", "title" }`; no request body | 404 for unknown id |

Errors use `{ "error": "message" }`. Methods without a route (for example `PUT /todos`) return 404
with `{ "error": "Not found" }`, not 405. Identifiers are opaque strings (UUID v4 by default) and
are not UUID-validated on input; an unknown id returns 404.

### Persistence caveat

By default the API is **memory only**: restarting the process clears all items. Optional persistence
uses Node.js Web Storage and requires a Node release with the experimental flags (verified on Node
v24.21.0):

```bash
cd ToDo1
node --experimental-webstorage --localstorage-file=/tmp/todo-api-localstorage.json src/app.js
```

**Both flags are required** — with `--experimental-webstorage` alone, accessing `localStorage`
throws and the service stays memory-only; Node 18 has neither flag. The file is created and managed
by the Node runtime, not by the application; choose a path outside version control. Storage
failures log a warning and never fail an API request: invalid stored entries are skipped, corrupt
stored JSON starts from an empty list, and a failed write leaves the in-memory change in place.

The page served at `/` is an auxiliary browser demo that keeps its own data in the browser's
localStorage and makes no API calls. The live demo linked above is the separate `ToDo2` frontend.

Not implemented (and not documented as available): a database, application file storage, a build
step, file logging, health checks, performance monitoring, a sanitization layer, authentication,
rate limiting, and CORS configuration.

## Review Issues and Fixes

This is a short record of review work. The frontend review is complete and its checks were
actually executed; the recorded results live in
[`ToDo2/specs/001-todo-list/quickstart.md`](ToDo2/specs/001-todo-list/quickstart.md) under
**Verification Record**. The backend review is complete as well; its recorded results live in
[`ToDo1/specs/001-todo-api/quickstart.md`](ToDo1/specs/001-todo-api/quickstart.md) under
**Verification Record**.

### Completed

- Problem: Git tracked `node_modules`. Fix: Removed it from Git tracking and kept local dependencies.
- Problem: The repository had no root `.gitignore`. Fix: Added rules for dependencies, environment files, logs, and temporary files.
- Problem: The frontend plan had wrong paths and structure details. Fix: Corrected them in `ToDo2/specs/001-todo-list/plan.md`.
- Problem: The frontend file location and server command were unclear. Fix: Clarified in `ToDo2/specs/001-todo-list/plan.md` that the files are in `ToDo2/` and the server runs from that directory.

### Frontend review — fixed and verified (2026-11-22)

The frontend review of `ToDo2/` is complete. All 33 validation scenarios defined in
[`quickstart.md`](ToDo2/specs/001-todo-list/quickstart.md) passed in Firefox 159 (headless)
against the real DOM and Local Storage; see the Verification Record in
[`quickstart.md`](ToDo2/specs/001-todo-list/quickstart.md) for the per-scenario results.

The run comprised **36 automated checks in total — 34 browser checks and 2 storage-failure
checks** (E4 and E5, exercised with Local Storage stubbed to throw). The 34 browser checks
cover 31 of the 33 named scenarios; the remaining two (E4, E5) are covered by the
storage-failure checks. Two scenarios use more than one browser check — A7 twice (toggle and
untoggle) and A8 three times (middle row, last row, only row) — which accounts for the 3
checks beyond one-per-scenario. A1 (tab order) and A9 (hostile id) each have a single check.
Six further checks were run outside the browser (`node --check`, a security grep, a
storage-key audit, an AA contrast spot check, a serve-location check, and a negative control)
and are recorded separately from the 36.

**Paths and server commands**

- Problem: `ToDo2/specs/001-todo-list/tasks.md` assumed the frontend lived at the repository
  root. Fix: Updated the header, Path Conventions, and every task to use `ToDo2/` paths, and
  stated that `ToDo2/` is the frontend project root while `ToDo1/` is a separate backend.
  Verified: serving from `ToDo2/` returns `index.html`, `app.js`, and `style.css` with HTTP 200,
  while serving from the repository root returns 404 for the root-relative `app.js`.
- Problem: `tasks.md` claimed "exact file paths are included in every task description" while
  listing bare filenames. Fix: Every task now names the full `ToDo2/`-prefixed path.
- Problem: `quickstart.md` told you to run `python3 -m http.server 8000` from the repository
  root, which serves a directory listing and breaks the relative `app.js` / `style.css`
  references. Fix: Now `cd ToDo2 && python3 -m http.server 8000`, with the reason explained.
  The same correction was applied to the T034 final-review task.

**Task descriptions that did not match the implementation**

- Problem: T003 said to define an "empty-state message constant", but the empty-state copy is
  static markup in `ToDo2/index.html`. Fix: T003 now names the two constants that actually
  exist (`STORAGE_UNAVAILABLE_MESSAGE`, `CORRUPT_DATA_MESSAGE`) and the real section list.
- Problem: T004 described `parseTasks` as returning "an empty array with an `unreadable` flag".
  Fix: It now specifies the real `{ tasks, unreadable }` return shape, the fully-invalid-array
  case, and the `migrateStoredTask` seam.
- Problem: T009 said `createTask` produces trimmed text, but trimming happens in
  `normalizeTitle`. Fix: T009 now states that `normalizeTitle` is the only trim point.
- Problem: T010, T015, T019, and T025 said the handlers call `saveTasks`, but they call
  `persist()`. Fix: All four now name `persist()`, and T023 introduces it as the single write
  gateway.

**Dependencies and ordering**

- Problem: T022 (startup restore) depends on `showStorageWarning()` from T023, but T023 was
  listed after T022 — implementing them in order would have thrown at startup. Fix: T023 now
  precedes T022 and the dependency section states the requirement explicitly.
- Problem: The US1–US3 validation tasks asserted reload persistence, which cannot be observed
  before the startup restore exists. Fix: Reload scenarios (Q6's reload half, P2, P3) are now
  validated in US4 (T026), and the earlier stories validate only in-session behavior.
- Problem: US1's validation expected the empty state to hide on the first add, but that
  behavior was assigned to US5. Fix: The empty-state toggle is now part of the foundational
  render (T007); T027 confirms and polishes it.
- Problem: T031 and T032 were both marked `[P]` but both said "fix any findings" while
  auditing the same three files. Fix: Both are now explicitly read-only audits; any required fix
  is filed as a separate, serialized task.

**Keyboard focus**

- Problem: Toggling a task re-rendered the list with `replaceChildren()`, destroying the
  focused checkbox and dropping focus to `document.body` — the focus ring disappeared and
  keyboard users lost their place. Fix: `ToDo2/app.js` now captures the task id and restores
  focus to the same row's checkbox after the re-render (`focusTaskCheckbox`). Verified: before
  the fix `document.activeElement` was `BODY` after a keyboard toggle; after the fix it is the
  matching `input.task-checkbox`, on both toggle and untoggle.
- Problem: The focus restore looked the row up with a CSS attribute selector built from the
  task id, but a restored id is only validated as "a non-empty string" and could contain `"`,
  which makes `querySelector` throw. Fix: The id is now escaped with `CSS.escape`. Verified with
  a negative control: without the escape the new A9 check fails with a `DOMException` and focus
  drops to `body`; with it, the toggle applies and focus is retained.
- Problem: Delete-focus behavior differed between the implementation, `tasks.md`, and
  `ui-contract.md`. Fix: All three now describe the same rule — focus moves to the row that
  occupies the deleted row's index (the next task, or the new last task), and to the task input
  only when the list becomes empty. Verified for the middle row, the last row, and the only row.

**Verification evidence**

- Problem: The validation tasks were marked complete but no pass/fail record existed anywhere
  in the repository, so the `[X]` markers were unsupported. Fix: `quickstart.md` now contains a
  **Verification Record** section with the date, browser, method, and a per-scenario result
  table, and the validation tasks state that they are only complete once their scenarios are
  recorded there.
- Problem: The accessibility audit (T032) was unverified, and the A4 network check was worded
  as "only the three files load", which no browser can satisfy because it always probes
  `/favicon.ico`. Fix: A4 now requires no third-party, font, or cross-origin requests, and
  treats the browser's automatic favicon probe as expected. Three new scenarios were added:
  A7 (focus retained on toggle), A8 (focus after delete), and A9 (hostile restored id).
- Problem: The reported test counts disagreed across the repository — the Verification Record
  listed 33 scenarios while this file claimed "36 browser scenarios", and neither stated how
  many automated checks were actually run. Fix: Both files now report the same figures —
  33 named scenarios, covered by 36 automated checks (34 browser + 2 storage-failure), plus 6
  checks performed outside the browser that are counted separately.

**Final review**

- Problem: T034's "remove dead code" could have deleted the `#add-button` DOM cache that T007
  requires, or the `SCHEMA_VERSION` / `migrateStoredTask` migration seam that `plan.md` G2
  requires. Fix: T034 now explicitly excludes both from "dead code".

### Backend review — fixed and verified (2026-11-22)

- Problem: The backend docs described only GET/POST and denied update, delete, and persistence. Fix:
  `ToDo1/specs/001-todo-api/` spec, data model, plan, contract, quickstart, and checklist now match
  the four implemented endpoints, opaque-id handling, and persistence/failure behavior.
- Problem: `tasks.md` contained `TXXX` placeholders, wrong paths, and unsupported claims (build
  step, generated logs, sanitization, monitoring, health checks). Fix: rebuilt with real task IDs,
  verified statuses, and traceability to actual files.
- Problem: The root Spec Kit feature pointer targeted a nonexistent directory. Fix:
  `.specify/feature.json` now points to `ToDo1/specs/001-todo-api`.
- Problem: The root constitution was entirely template placeholders. Fix: replaced with concise
  project principles, constraints, and quality gates.
- Problem: The package description named only in-memory storage and `todo.routes.js` failed the
  format check on a trailing blank line. Fix: description now mentions optional Web Storage
  persistence; the blank line was removed with no behavior change.
- Problem: Documented behavior had no automated witness for non-object bodies, unsupported methods,
  or the PATCH/DELETE contract shapes. Fix: five tests added; 50 pass.
- Verification: `cd ToDo1 && npm test` (50 pass, 0 fail), `npm run lint` (clean),
  `npm run format:check` (clean); spec-kit prerequisite check resolves the backend feature directory.

### Partially verified (frontend)

- E4 and E5 were exercised against a same-origin copy of the app with Local Storage access
  stubbed to throw, not against a browser's real "block site data" setting. They are counted
  as the 2 storage-failure checks rather than as browser checks.
- Only Firefox was available in this environment, so Chrome, Edge, and Safari were not exercised.
- Screen-reader announcement quality was verified only at the `role="status"` attribute level
  and by confirming that the warning does not move focus.
