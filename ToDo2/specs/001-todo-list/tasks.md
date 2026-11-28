# Tasks: Simple To-Do List

**Input**: Design documents from `ToDo2/specs/001-todo-list/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user
stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/),
[quickstart.md](./quickstart.md)

**Tests**: No test tasks are generated. The project constitution forbids test-framework
dependencies and build tooling; verification is manual browser testing per
[quickstart.md](./quickstart.md), and each story phase includes a validation task.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. All runtime code lives in exactly three files in the frontend project
root `ToDo2/`: `ToDo2/index.html`, `ToDo2/style.css`, and `ToDo2/app.js` (no `src/`, `tests/`,
or other application source directories).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description, relative to the repository root

## Path Conventions

- Static single-project web app in the frontend project root `ToDo2/`: `ToDo2/index.html`,
  `ToDo2/style.css`, `ToDo2/app.js`
- The frontend project root is `ToDo2/`, **not** the repository root; `ToDo1/` is a separate
  backend project and must not be modified by these tasks
- Spec artifacts under `ToDo2/specs/001-todo-list/`
- Serve from the frontend project root with `cd ToDo2 && python3 -m http.server 8000`
  (see [quickstart.md](./quickstart.md))

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the three-file shell and module scaffolding fixed by the contracts

- [X] T001 [P] Create `ToDo2/index.html` with the full UI contract markup: `<title>To-Do List</title>`, `header > h1`, `main`, `form#task-form` containing `label[for="task-input"]`, `input#task-input` (`type="text"`, `name="text"`, `autocomplete="off"`, `placeholder="What needs doing?"`), `button#add-button[type="submit"]`, `p#storage-warning` (`role="status"`, `hidden`), `p#empty-state` with a friendly message, `ul#task-list`, and `<script type="module" src="app.js"></script>`; do not use inline event-handler attributes
- [X] T002 [P] Create `ToDo2/style.css` with a reset, CSS custom properties for color/spacing/radius, system font stack, page layout, form layout, and a responsive single-column layout usable from 320 px, plus a visible `:focus-visible` outline on all focusable controls
- [X] T003 [P] Create `ToDo2/app.js` as a single ES module with a module-responsibility header comment and documented sections (Constants, State, Storage, Storage status, Domain, Render, Events, Events/Init); define `STORAGE_KEY = 'todo_app_tasks'`, `SCHEMA_VERSION = 1`, DOM selector constants (`SELECTORS`), and the storage warning message constants `STORAGE_UNAVAILABLE_MESSAGE` and `CORRUPT_DATA_MESSAGE` (the empty-state copy is static markup in `ToDo2/index.html`, not a constant)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence primitives, safe row rendering, and guarded initialization that every
user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement `isValidTask(value)`, `migrateStoredTask(value)`, and `parseTasks(raw)` in the Storage section of `ToDo2/app.js` per data-model rules V1–V7: parsed value must be an array; each element must be a non-null object; `id` must be a non-empty string and unique within the list; `text` must be a string and non-empty after trimming; `completed` must be a boolean; drop invalid elements and later duplicate ids; return `{ tasks, unreadable }` where `tasks` is `[]` on parse failure or a non-array payload, and `unreadable` is `true` on parse failure, on a non-array payload, or when every element was dropped; never throw
- [X] T005 Implement `loadTasks()` and `saveTasks(tasks)` in the Storage section of `ToDo2/app.js`: `loadTasks` reads only `todo_app_tasks`, returns `{ tasks, unreadable, readFailed }`, and treats an absent key as `[]` with no warning; `saveTasks` serializes only `id`, `text`, and `completed` with `JSON.stringify`, writes `todo_app_tasks`, returns `true` on success and `false` on any exception, and never throws
- [X] T006 Implement `renderTask(task)` in the Render section of `ToDo2/app.js` per the UI contract: build `li.task[data-task-id]` (class `task--completed` when `task.completed`), a native `input.task-checkbox[type="checkbox"]` with `checked` set from `task.completed` and an accessible name equal to the task text, a `span.task-text` set with `textContent` only, and `button.task-delete[type="button"]` labeled "Delete" with `aria-label="Delete task: {text}"`
- [X] T007 Implement DOM reference caching, `render(tasks)` (rebuild `#task-list` in array order using `renderTask`, without using `innerHTML` for task data, and toggling `#empty-state` visibility through `updateEmptyState()`), and a guarded `init()` in `ToDo2/app.js` that caches references to `#task-form`, `#task-input`, `#add-button`, `#storage-warning`, `#empty-state`, and `#task-list`, then renders `state.tasks` inside a `try/catch` so startup never throws (T022 later adds the startup restore in front of that render)

**Checkpoint**: Storage primitives and safe rendering exist; user stories can now begin.

---

## Phase 3: User Story 1 - Add and View Tasks (Priority: P1) 🎯 MVP

**Goal**: Users add a non-empty task via the Add button or Enter and see it appended to the
vertical list in order; blank submissions create nothing.

**Independent Test**: From a clean `todo_app_tasks` key, add three tasks (two via Add, one via
Enter) and confirm all three render in order, whitespace-only input adds nothing, titles are
trimmed, duplicates create separate rows, and the input clears after each successful add.

### Implementation for User Story 1

- [X] T008 [US1] Implement `normalizeTitle(raw)` in the Domain section of `ToDo2/app.js`: return the trimmed string when it contains at least one non-whitespace character, otherwise return `null` (no task is created for empty or whitespace-only input)
- [X] T009 [US1] Implement `generateId()` (use `crypto.randomUUID()` when available, else `Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)`) and `createTask(text)` in the Domain section of `ToDo2/app.js`, producing `{ id, text, completed: false }` with a non-empty unique string `id`; `createTask` stores the already-normalized title, and `normalizeTitle()` is the only place the title is trimmed
- [X] T010 [US1] Implement `handleSubmit(event)` in the Events section of `ToDo2/app.js`: call `event.preventDefault()`, read `#task-input`, run `normalizeTitle`, and on `null` keep focus in the input and perform no write; otherwise append the new task to `state.tasks` (oldest first, newest last), call `persist()`, call `render`, clear the input, and keep focus in the input
- [X] T011 [US1] Bind the `#task-form` `submit` listener to `handleSubmit` in `bindEvents()`, which is called once from `init()` in `ToDo2/app.js` (bind once; Enter in the input submits the form natively)
- [X] T012 [P] [US1] Add task row layout styling to `ToDo2/style.css`: single-column rows with checkbox, wrapping title (`overflow-wrap: anywhere`), and delete control aligned without horizontal scrolling at 320 px
- [X] T013 [US1] Validate User Story 1 using quickstart scenarios Q2–Q5 and P5 plus the in-session half of Q6 in [quickstart.md](./quickstart.md), including trim, blank rejection, append order, and duplicate-title independence; record pass/fail outcomes in the verification record (reload persistence for these flows is validated by T026)

**Checkpoint**: User Story 1 is fully functional and testable independently (MVP).

---

## Phase 4: User Story 2 - Track Completion (Priority: P2)

**Goal**: Checking a task marks it completed with a strikethrough and checked box; unchecking
restores it; other tasks are unaffected.

**Independent Test**: With at least two tasks present, toggle one checkbox on and off and
confirm the completed class/strikethrough and checked state change only for that task, and that
keyboard focus stays on the toggled checkbox. (Reload persistence is covered by US4.)

### Implementation for User Story 2

- [X] T014 [US2] Implement `toggleTask(id)` in the Domain section of `ToDo2/app.js`: find exactly one task by `id`, flip its boolean `completed` value, return the updated task or `null` when not found, and never mutate other tasks
- [X] T015 [US2] Implement `handleToggle(event)` in the Events section of `ToDo2/app.js`: ignore events whose target is not within a `.task-checkbox`, read the owning `li.task[data-task-id]`, call `toggleTask`, then `persist()` and `render`; because the re-render replaces the row, restore focus to the same row's checkbox via `focusTaskCheckbox(id)` so keyboard users stay on the control they just operated; bind this delegated `change` listener on `#task-list` once in `bindEvents()`, which is called from `init()`
- [X] T016 [P] [US2] Add completed-state styling to `ToDo2/style.css`: `.task--completed .task-text` uses `text-decoration: line-through` plus a muted color (completion conveyed by strikethrough and checkbox, not color alone); style the checkbox for touch-friendly size
- [X] T017 [US2] Validate User Story 2 using quickstart scenarios Q7–Q9 in [quickstart.md](./quickstart.md), covering toggle, untoggle, and new-task default, plus the focus-retention check after a keyboard toggle; record pass/fail outcomes in the verification record (reload persistence for toggling is validated by T026)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Delete Tasks (Priority: P3)

**Goal**: Each task row has a delete control that removes exactly that task and persists the
removal; focus remains usable afterward.

**Independent Test**: With three tasks, delete the middle one and confirm only it is removed in
order, and deleting the last task leaves an empty list; keyboard focus moves to the row now at
the deleted index (the next row's delete control, or the previous row's when the last row is
deleted), and to the task input only when no tasks remain. (Reload persistence is covered by
US4.)

### Implementation for User Story 3

- [X] T018 [US3] Implement `deleteTask(id)` in the Domain section of `ToDo2/app.js`: remove exactly the task matching `id` from `state.tasks` and report whether a deletion occurred, leaving the relative order of remaining tasks unchanged
- [X] T019 [US3] Implement `handleDelete(event)` in the Events section of `ToDo2/app.js`: resolve the clicked `button.task-delete` via `closest`, read its `li[data-task-id]`, call `deleteTask`, then `persist()` and `render`; after rendering, move focus to the row that now occupies the deleted row's index — the following task's delete control when one exists, otherwise the new last task's delete control — and move focus to `#task-input` only when no tasks remain; bind this delegated `click` listener on `#task-list` once in `bindEvents()`, which is called from `init()`
- [X] T020 [P] [US3] Add delete-control styling to `ToDo2/style.css`: distinguishable delete button with visible `:focus-visible` outline and an accessible hit area
- [X] T021 [US3] Validate User Story 3 using quickstart scenario Q10 in [quickstart.md](./quickstart.md), plus keyboard-only deletion and post-delete focus behavior (middle row, last row, and only row); record pass/fail outcomes in the verification record (reload persistence for deletion is validated by T026)

**Checkpoint**: User Stories 1–3 work independently.

---

## Phase 6: User Story 4 - Persistence Across Reloads (Priority: P4)

**Goal**: All mutations save automatically without a save action, reloads restore titles,
completion states, and order, and storage failures never break the session.

**Independent Test**: Add two tasks, complete one, delete another, reload, and confirm the
remaining tasks, their order, and completion states are identical; then corrupt the stored value
and confirm the app opens empty with a warning and no uncaught error.

### Implementation for User Story 4

- [X] T023 [US4] Implement storage status handling in `ToDo2/app.js`: maintain `persistenceAvailable`, a `showStorageWarning(message)`/`hideStorageWarning()` pair that toggles `hidden` on `#storage-warning` (`role="status"`), and a `persist()` helper that is the single write gateway — it calls `saveTasks(state.tasks)` once, shows "Changes can't be saved in this browser, but you can keep using the list." on write failure, shows "Saved tasks couldn't be loaded, so the list started empty." when `unreadable` is true, and hides the warning only after a subsequent successful write. This task must be completed before T022, because the startup restore calls `showStorageWarning()`
- [X] T022 [US4] Integrate startup restore in `init()` in `ToDo2/app.js`: call `loadTasks()` before the first render, assign the validated array to `state.tasks`, render the persisted order and completion states, keep an absent key silent (empty list, no warning), and surface read failures and unreadable data through the `showStorageWarning()` pair from T023. Depends on T023
- [X] T024 [P] [US4] Add `.storage-warning` styling in `ToDo2/style.css`: visually distinct notice above the list using more than color alone, readable at 320 px
- [X] T025 [US4] Centralize persistence in `ToDo2/app.js`: ensure each add, toggle, and delete path calls `persist()` exactly once after the in-memory mutation and before the handler returns, that `persist()` is the only `saveTasks()` call site, that a rejected blank submission performs no write, and that write failure keeps in-memory state and triggers the unavailable warning
- [X] T026 [US4] Validate User Story 4 using quickstart scenarios P1–P4, E1–E3, and E8 in [quickstart.md](./quickstart.md), including the stored value being a bare JSON array of `{id, text, completed}` objects and no uncaught console errors on corrupt data; record pass/fail outcomes in the verification record

**Checkpoint**: All data operations persist correctly; failure modes degrade gracefully.

---

## Phase 7: User Story 5 - Friendly Empty State (Priority: P5)

**Goal**: A friendly message replaces the blank list when no tasks exist and disappears as soon
as a task is added, returning when the list empties.

**Independent Test**: On a clean start the message is visible with the form still usable; adding
one task hides it; deleting that task shows it again.

### Implementation for User Story 5

- [X] T027 [US5] Implement `updateEmptyState()` in the Render section of `ToDo2/app.js` and call it from `render(tasks)`: remove `hidden` from `#empty-state` exactly when `tasks.length === 0`, restore `hidden` otherwise, and never disable the form or Add control. The toggle itself is part of the foundational render in T007 so that the empty state is correct from the first add; this task confirms and polishes the behavior
- [X] T028 [P] [US5] Style `#empty-state` in `ToDo2/style.css`: friendly, muted, centered message with spacing that keeps the form visible and usable at 320 px
- [X] T029 [US5] Validate User Story 5 using quickstart scenarios Q1 and Q11 in [quickstart.md](./quickstart.md), confirming visibility toggling on cold start, first add, and last delete; record pass/fail outcomes in the verification record

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Constitution-mandated documentation, security/accessibility audits, and full
end-to-end validation

- [X] T030 Documentation pass in `ToDo2/app.js`: ensure every function documents parameters, return value, and failure behavior; add intent comments for validation, id-generation fallback, storage-failure recovery, and focus management (Principle IV)
- [X] T031 [P] Security audit (read-only) across `ToDo2/index.html`, `ToDo2/style.css`, and `ToDo2/app.js`: confirm no `innerHTML` with task data, no `eval`/`new Function`, no inline event-handler attributes, no external scripts/styles/fonts, and that only `todo_app_tasks` is ever written to storage; record the findings in the verification record and file any required fixes as a separate, serialized task so this audit never edits files in parallel with T032
- [X] T032 Accessibility audit (read-only) per quickstart A1–A3: verify label association, per-row accessible names, keyboard tab order (input → Add → checkbox → Delete), focus retention after a keyboard toggle, visible focus indicators, `role="status"` announcement, and AA contrast; record the findings in the verification record and file any required fixes as a separate, serialized task so this audit never edits files in parallel with T031
- [X] T033 Run the remaining quickstart checks A4–A6 and E4–E7 in [quickstart.md](./quickstart.md): no third-party or external network requests (only the same-origin project files, plus the browser's automatic `/favicon.ico` probe), no console errors, 100-task render under 1 second, storage-disabled session behavior, 320 px long-title wrapping, and literal rendering of special characters; record pass/fail outcomes in the verification record and file any required fixes as a separate task
- [X] T034 Final review of the three-file deliverable (`ToDo2/index.html`, `ToDo2/style.css`, `ToDo2/app.js`): remove genuinely unreferenced code and stray comments, but **keep** the `#add-button` DOM cache required by T007 and the `SCHEMA_VERSION` / `migrateStoredTask` migration seam required by `plan.md` G2 — these are required by contract and must not be treated as dead code; confirm no build step or dependency is required; confirm `cd ToDo2 && python3 -m http.server 8000` serves the app at `http://localhost:8000/`; confirm the stored array shape matches [contracts/storage-contract.md](./contracts/storage-contract.md); and record the review outcome in the verification record

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001–T003 touch different files and can run in parallel
- **Foundational (Phase 2)**: Depends on T001–T003; BLOCKS all user stories (T004–T007 are all
  in `ToDo2/app.js` and must run in order)
- **User Stories (Phases 3–7)**: Each depends on Foundational completion
  - US1 → US2 → US3 → US4 → US5 in priority order by default
  - US2 and US3 require tasks to exist for testing; use US1 or seed `todo_app_tasks` manually
  - The startup restore (T022) is what makes reload persistence observable, so reload-based
    scenarios (Q6's reload half, P2, P3) are validated in US4 (T026), not in the earlier stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Needs Foundational only — creates the task data other stories operate on. The
  empty-state toggle lives in the foundational render (T007) so the US1 validation in T013 can
  assert that the empty state hides on the first add
- **US2 (P2)**: Needs Foundational; toggles tasks produced by US1 (or seeded data)
- **US3 (P3)**: Needs Foundational; deletes tasks produced by US1 (or seeded data)
- **US4 (P4)**: Needs Foundational and the mutation handlers from US1–US3 to autosave. Within
  US4, T023 (storage status handling and the `persist()` write gateway) must be completed
  **before** T022 (startup restore), because the restore path calls `showStorageWarning()`
- **US5 (P5)**: Needs Foundational rendering plus at least add/delete flows to observe toggling

### Within Each User Story

- Domain function before its event handler
- Event handler before the listener binding task
- CSS task for the story runs in parallel with that story's `ToDo2/app.js` work
- Story validation runs last, after implementation

### Parallel Opportunities

- T001, T002, T003 are fully parallel (three different files)
- `ToDo2/app.js` tasks are sequential within and across phases (single file); never run two
  `ToDo2/app.js` tasks concurrently
- T012 (US1 CSS), T016 (US2 CSS), T020 (US3 CSS), T024 (US4 CSS), T028 (US5 CSS) all edit
  `ToDo2/style.css`, so they are parallel only against `ToDo2/app.js` work in the same phase,
  never against each other
- T031 and T032 are **read-only** audits and may run in parallel, because neither task edits the
  audited files; any required fix is filed as a separate, serialized task
- Story phases may be staffed in parallel only if `ToDo2/style.css` edits are coordinated or
  serialized

---

## Parallel Example: Setup

```bash
# Three independent files:
Task: "Create ToDo2/index.html with the full UI contract markup"
Task: "Create ToDo2/style.css with reset, tokens, layout, focus styles"
Task: "Create ToDo2/app.js module skeleton with constants and section headers"
```

## Parallel Example: User Story 1

```bash
# Run JS implementation sequentially, with the CSS task alongside:
Task: "Implement normalizeTitle/createTask in ToDo2/app.js"
Task: "Implement handleSubmit in ToDo2/app.js (after domain functions)"
Task: "Add task row layout styling to ToDo2/style.css"   # parallel with app.js work
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocking)
3. Complete Phase 3: User Story 1 (add/view)
4. **STOP and VALIDATE** with quickstart Q2–Q5, P5, and the in-session part of Q6
5. Demo the working add/view list (in-session persistence already active)

### Incremental Delivery

1. Setup + Foundational → shell and safe storage/rendering ready
2. US1 → validate → demo (MVP)
3. US2 → validate → demo completion tracking
4. US3 → validate → demo deletion
5. US4 → validate → demo full reload persistence and failure handling
6. US5 → validate → demo empty-state polish
7. Polish → security, accessibility, performance, and full quickstart validation
8. Each step preserves earlier behavior

### Notes

- No tests are generated; the constitution forbids test-framework dependencies. Use
  [quickstart.md](./quickstart.md) as the verification record — every validation task must record
  its scenario results there (date, browser, pass/fail, notes) before it counts as complete.
- `[P]` means different files and no incomplete dependencies — not simply "separate concern".
- All tasks are immediately executable without additional context; contracts define every
  selector, message, and data rule referenced above.
- Commit after each logical group only when the user requests it.
