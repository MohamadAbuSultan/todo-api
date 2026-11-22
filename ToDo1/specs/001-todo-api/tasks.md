# Tasks: Minimal To-Do API

**Input**: Design documents from `ToDo1/specs/001-todo-api/`

**Prerequisites**: `spec.md`, `plan.md`, `data-model.md`, `contracts/todo-api.json`,
`quickstart.md`, `checklists/requirements.md` (all present; no `research.md` exists or is required).

**Status**: Implemented and verified (2026-11-22). Every task below is checked because its work was
completed and confirmed by the verification commands recorded at the end of this file.

**Path convention**: Paths are relative to the repository root (`/mnt/Back-End/NodeJs/ToDo1`).
Commands run from `ToDo1/`, which is the backend project root. `ToDo2/` is a separate frontend and
is not in scope for these tasks.

## Format: `[ID] [Story] Description`

- **[Story]**: maps a task to a user story (US1–US4) or to infrastructure/docs when no story applies.
- Every task names the exact file path it touches or verifies.

---

## Phase 1: Setup and repository tooling

- [x] **T001**: Create the backend package manifest and scripts in `ToDo1/package.json`, with the
  dependency lock in `ToDo1/package-lock.json`. Verified: `npm test`, `npm run lint`,
  `npm run format:check` all run from `ToDo1/`.
- [x] **T002**: Configure linting and formatting at the repository root in `.eslintrc.json`,
  `.eslintignore`, `.prettierrc`, and `.prettierignore`. Verified: `npm run lint` and
  `npm run format:check` exit 0.
- [x] **T003**: Correct the Spec Kit feature pointer in `.specify/feature.json` (git-ignored local
  state) from `specs/001-todo-api` to `ToDo1/specs/001-todo-api`. Verified:
  `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks` resolves the
  backend feature directory.
- [x] **T004**: Replace template placeholders in `.specify/memory/constitution.md` with five
  project principles, technical constraints, quality gates, and a version line. Verified: no
  `[PLACEHOLDER]` tokens remain.

---

## Phase 2: Core application structure

- [x] **T005**: Build the Express app in `ToDo1/src/app.js`: JSON body parsing, security headers,
  static demo, service/router wiring, structured 404 and error handlers. Verified by integration
  tests.
- [x] **T006**: Implement title validation in `ToDo1/src/utils/validation.js` and trimming in
  `ToDo1/src/models/todo-item.js` (`ToDo1/tests/unit/validation.test.js`).
- [x] **T007**: Define the immutable `TodoItem` model in `ToDo1/src/models/todo-item.js`.
- [x] **T008**: Implement the optional Web Storage adapter in `ToDo1/src/storage/local-storage.js`
  with guarded reads and non-fatal write failures (`ToDo1/tests/unit/local-storage.test.js`).
- [x] **T009**: Implement create/list/update/delete plus load/persist in
  `ToDo1/src/services/todo.service.js` (`ToDo1/tests/unit/todo-service.test.js`,
  `ToDo1/tests/unit/todo-service-persistence.test.js`).
- [x] **T010**: Implement the HTTP routes in `ToDo1/src/api/todo.routes.js` and remove its trailing
  blank line so `format:check` passes; no behavior changed.

---

## Phase 3: US1 — Create a To-Do Item (P1)

- [x] **T011 [US1]**: Contract test for POST /todos in `ToDo1/tests/contract/todo.test.js`.
- [x] **T012 [US1]**: Integration tests for create and validation errors in
  `ToDo1/tests/integration/todo.test.js`.
- [x] **T013 [US1]**: Unit tests for title validation in `ToDo1/tests/unit/validation.test.js`.
- [x] **T014 [US1]**: Provide the ephemeral test server in `ToDo1/tests/helpers/server.js`, used by
  all contract and integration tests.

---

## Phase 4: US2 — List To-Do Items (P1)

- [x] **T015 [US2]**: Integration tests for list, ordering, and empty collection in
  `ToDo1/tests/integration/todo.test.js`.
- [x] **T016 [US2]**: Unit tests for `getAll` in `ToDo1/tests/unit/todo-service.test.js`.

---

## Phase 5: US3 — Update a To-Do Item (P2)

- [x] **T017 [US3]**: Integration tests for PATCH success, required title, and unknown-id 404 in
  `ToDo1/tests/integration/todo-update-delete.test.js`.
- [x] **T018 [US3]**: Unit test for `TodoService.update` persistence in
  `ToDo1/tests/unit/todo-service-persistence.test.js`.

---

## Phase 6: US4 — Delete a To-Do Item (P2)

- [x] **T019 [US4]**: Integration tests for DELETE success (200 with deleted item) and unknown-id
  404 in `ToDo1/tests/integration/todo-update-delete.test.js`.
- [x] **T020 [US4]**: Unit test for `TodoService.remove` persistence in
  `ToDo1/tests/unit/todo-service-persistence.test.js`.

---

## Phase 7: Optional persistence and failure behavior

- [x] **T021**: Unit tests for `LocalStorageStore` (load, save, clear, missing store, quota and
  serialization failures) in `ToDo1/tests/unit/local-storage.test.js`.
- [x] **T022**: Unit tests for service load/persist, invalid stored entries, custom key, and
  non-fatal write failure in `ToDo1/tests/unit/todo-service-persistence.test.js`.
- [x] **T023**: Manual two-process verification of `node --experimental-webstorage
  --localstorage-file=<path> src/app.js` persistence across a restart; result recorded in
  `ToDo1/specs/001-todo-api/quickstart.md`.

---

## Phase 8: Auxiliary browser demo (not part of the API contract)

- [x] **T024**: Provide the static demo in `ToDo1/public/index.html`; it stores data in the
  browser's localStorage and makes no API calls. Documented as auxiliary in `spec.md`, `plan.md`,
  `quickstart.md`, `data-model.md`, and `README.md`.

---

## Phase 9: Documentation alignment

- [x] **T025**: Align `ToDo1/specs/001-todo-api/spec.md` with all four endpoints, optional
  persistence, opaque ids, storage failures, and unsupported-method 404s.
- [x] **T026**: Correct `ToDo1/specs/001-todo-api/data-model.md` (id validation, O(n) lookup,
  persistence/failure semantics, demo-only `completed` flag).
- [x] **T027**: Extend `ToDo1/specs/001-todo-api/contracts/todo-api.json` with PATCH and DELETE,
  the opaque id parameter, and accurate 400 examples. Verified: contract parses as JSON and its
  operations are asserted by `ToDo1/tests/contract/todo.test.js`.
- [x] **T028**: Extend `ToDo1/tests/contract/todo.test.js` with PATCH/DELETE 200 shapes and 404
  shape coverage (contract test count increased by three).
- [x] **T029**: Extend `ToDo1/tests/integration/todo.test.js` with non-object/primitive body
  handling and unsupported-method 404 coverage (integration test count increased by two).
- [x] **T030**: Rewrite `ToDo1/specs/001-todo-api/plan.md` with real paths and dependencies, the
  constitution check, persistence behavior, and an explicit non-goals list.
- [x] **T031**: Rewrite `ToDo1/specs/001-todo-api/quickstart.md` with all four endpoints, the exact
  persistence flags, scenarios, validation commands, and a Verification Record.
- [x] **T032**: Update `ToDo1/specs/001-todo-api/checklists/requirements.md` with an implementation
  alignment section and corrected notes.
- [x] **T033**: Update `README.md` with backend setup, tests, endpoint summary, persistence caveat,
  the frontend-only live-demo clarification, and the completed backend review record.
- [x] **T034**: Correct the description in `ToDo1/package.json` to mention optional Web Storage
  persistence (package metadata only; no engines or dependency change).
- [x] **T035**: Rebuild this task ledger with real IDs, verified statuses, and file traceability.
  Verified: task IDs are concrete and sequential; no placeholder-style IDs or active references to
  nonexistent files remain in `tasks.md`.

---

## Phase 10: Final verification

- [x] **T036**: Run `cd ToDo1 && npm test` — 50 tests, 50 pass, 0 fail.
- [x] **T037**: Run `cd ToDo1 && npm run lint` — exit 0, no findings.
- [x] **T038**: Run `cd ToDo1 && npm run format:check` — exit 0, all matched files formatted.
- [x] **T039**: Run `git diff --check` — exit 0, no whitespace errors.
- [x] **T040**: Confirm the Spec Kit prerequisite check resolves `ToDo1/specs/001-todo-api` and
  lists the available docs (data model, contracts, quickstart).

## Dependency notes

- Phases 1–2 are prerequisites for every user story; US1–US4 each have independent integration
  coverage and can be verified separately.
- Documentation tasks follow their corresponding implementation tasks; a documentation task is
  marked complete only after the matching file and tests were verified.
- The final verification phase follows all implementation and documentation tasks.

## Verification record

| Check | Command | Result (2026-11-22) |
| --- | --- | --- |
| Tests | `cd ToDo1 && npm test` | 50 tests, 50 pass, 0 fail |
| Lint | `cd ToDo1 && npm run lint` | exit 0, no output |
| Format | `cd ToDo1 && npm run format:check` | exit 0, all matched files formatted |
| Whitespace | `git diff --check` | exit 0 |
| Spec Kit paths | `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks` | resolves `ToDo1/specs/001-todo-api` |
| Contract JSON | `node -e "require('./specs/001-todo-api/contracts/todo-api.json')"` | parses successfully |

## Notes

- No unchecked tasks remain.
- No runtime behavior was changed: the only source edit was a whitespace-only fix in
  `ToDo1/src/api/todo.routes.js`.
- No product features were added; the five added tests only observe existing behavior.
- No commit or push was performed.
