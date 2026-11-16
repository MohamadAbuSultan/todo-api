# Tasks: Simple To-Do List

**Input**: Design documents from `/specs/001-todo-list/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user
stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/),
[quickstart.md](./quickstart.md)

**Tests**: No test tasks are generated. The project constitution forbids test-framework
dependencies and build tooling; verification is manual browser testing per
[quickstart.md](./quickstart.md), and each story phase includes a validation task.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. All code lives in exactly three root files: `index.html`, `style.css`,
and `app.js` (no `src/`, `tests/`, or other directories).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

## Path Conventions

- Static single-project web app at repository root: `index.html`, `style.css`, `app.js`
- Spec artifacts under `specs/001-todo-list/`
- Serve with `python3 -m http.server 8000` (see [quickstart.md](./quickstart.md))

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the three-file shell and module scaffolding fixed by the contracts

- [X] T001 [P] Create `index.html` with the full UI contract markup: `<title>To-Do List</title>`, `header > h1`, `main`, `form#task-form` containing `label[for="task-input"]`, `input#task-input` (`type="text"`, `name="text"`, `autocomplete="off"`, `placeholder="What needs doing?"`), `button#add-button[type="submit"]`, `p#storage-warning` (`role="status"`, `hidden`), `p#empty-state` with a friendly message, `ul#task-list`, and `<script type="module" src="app.js"></script>`; do not use inline event-handler attributes
- [X] T002 [P] Create `style.css` with a reset, CSS custom properties for color/spacing/radius, system font stack, page layout, form layout, and a responsive single-column layout usable from 320 px, plus a visible `:focus-visible` outline on all focusable controls
- [X] T003 [P] Create `app.js` as a single ES module with a module-responsibility header comment and documented sections (Constants, Storage, State, Domain, Render, Events/Init); define `STORAGE_KEY = 'todo_app_tasks'`, `SCHEMA_VERSION = 1`, DOM selector constants, and warning/empty-state message constants

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistence primitives, safe row rendering, and guarded initialization that every
user story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement `isValidTask(value)` and `parseTasks(raw)` in the Storage section of `app.js` per data-model rules V1–V7: parsed value must be an array; each element must be a non-null object; `id` must be a non-empty string and unique within the list; `text` must be a string and non-empty after trimming; `completed` must be a boolean; drop invalid elements and later duplicate ids, and return an empty array with an `unreadable` flag on parse failure or non-array payload (never throw)
- [X] T005 Implement `loadTasks()` and `saveTasks(tasks)` in the Storage section of `app.js`: `loadTasks` reads only `todo_app_tasks`, returns `{ tasks, unreadable, readFailed }`, and treats an absent key as `[]` with no warning; `saveTasks` serializes only `id`, `text`, and `completed` with `JSON.stringify`, writes `todo_app_tasks`, returns `true` on success and `false` on any exception, and never throws
- [X] T006 Implement `renderTask(task)` in the Render section of `app.js` per the UI contract: build `li.task[data-task-id]` (class `task--completed` when `task.completed`), a native `input.task-checkbox[type="checkbox"]` with `checked` set from `task.completed` and an accessible name equal to the task text, a `span.task-text` set with `textContent` only, and `button.task-delete[type="button"]` labeled "Delete" with `aria-label="Delete task: {text}"`
- [X] T007 Implement DOM reference caching, `render(tasks)` (rebuild `#task-list` in array order using `renderTask`, without using `innerHTML` for task data), and a guarded `init()` in `app.js` that caches references to `#task-form`, `#task-input`, `#add-button`, `#storage-warning`, `#empty-state`, and `#task-list`, then calls `render` with the current empty state inside a `try/catch` so startup never throws

**Checkpoint**: Storage primitives and safe rendering exist; user stories can now begin.

---

## Phase 3: User Story 1 - Add and View Tasks (Priority: P1) 🎯 MVP

**Goal**: Users add a non-empty task via the Add button or Enter and see it appended to the
vertical list in order; blank submissions create nothing.

**Independent Test**: From a clean `todo_app_tasks` key, add three tasks (two via Add, one via
Enter) and confirm all three render in order, whitespace-only input adds nothing, titles are
trimmed, duplicates create separate rows, and the input clears after each successful add.

### Implementation for User Story 1

- [X] T008 [US1] Implement `normalizeTitle(raw)` in the Domain section of `app.js`: return the trimmed string when it contains at least one non-whitespace character, otherwise return `null` (no task is created for empty or whitespace-only input)
- [X] T009 [US1] Implement `generateId()` (use `crypto.randomUUID()` when available, else `Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)`) and `createTask(text)` in the Domain section of `app.js`, producing `{ id, text, completed: false }` with a non-empty unique string `id` and trimmed `text`
- [X] T010 [US1] Implement `handleSubmit(event)` in the Events section of `app.js`: call `event.preventDefault()`, read `#task-input`, run `normalizeTitle`, and on `null` keep focus in the input and perform no write; otherwise append the new task to `state.tasks` (oldest first, newest last), call `saveTasks`, call `render`, clear the input, and keep focus in the input
- [X] T011 [US1] Bind the `#task-form` `submit` listener to `handleSubmit` inside `init()` in `app.js` (bind once; Enter in the input submits the form natively)
- [X] T012 [P] [US1] Add task row layout styling to `style.css`: single-column rows with checkbox, wrapping title (`overflow-wrap: anywhere`), and delete control aligned without horizontal scrolling at 320 px
- [X] T013 [US1] Validate User Story 1 using quickstart scenarios Q2–Q6 and P5 in [quickstart.md](./quickstart.md), including trim, blank rejection, append order, and duplicate-title independence; record pass/fail outcomes

**Checkpoint**: User Story 1 is fully functional and testable independently (MVP).

---

## Phase 4: User Story 2 - Track Completion (Priority: P2)

**Goal**: Checking a task marks it completed with a strikethrough and checked box; unchecking
restores it; other tasks are unaffected.

**Independent Test**: With at least two tasks present, toggle one checkbox on and off and
confirm the completed class/strikethrough and checked state change only for that task, then
reload and confirm the state persisted.

### Implementation for User Story 2

- [X] T014 [US2] Implement `toggleTask(id)` in the Domain section of `app.js`: find exactly one task by `id`, flip its boolean `completed` value, return the updated task or `null` when not found, and never mutate other tasks
- [X] T015 [US2] Implement `handleToggle(event)` in the Events section of `app.js`: ignore events whose target is not `.task-checkbox`, read the owning `li.task[data-task-id]`, call `toggleTask`, then `saveTasks` and `render`; bind this delegated `change` listener on `#task-list` once inside `init()`
- [X] T016 [P] [US2] Add completed-state styling to `style.css`: `.task--completed .task-text` uses `text-decoration: line-through` plus a muted color (completion conveyed by strikethrough and checkbox, not color alone); style the checkbox for touch-friendly size
- [X] T017 [US2] Validate User Story 2 using quickstart scenarios Q7–Q9 and P2 in [quickstart.md](./quickstart.md), covering toggle, untoggle, new-task default, and reload persistence; record pass/fail outcomes

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Delete Tasks (Priority: P3)

**Goal**: Each task row has a delete control that removes exactly that task and persists the
removal; focus remains usable afterward.

**Independent Test**: With three tasks, delete the middle one and confirm only it is removed in
order, the deletion survives reload, and deleting the last task leaves an empty list; keyboard
focus moves to the next delete control or the input.

### Implementation for User Story 3

- [X] T018 [US3] Implement `deleteTask(id)` in the Domain section of `app.js`: remove exactly the task matching `id` from `state.tasks` and report whether a deletion occurred, leaving the relative order of remaining tasks unchanged
- [X] T019 [US3] Implement `handleDelete(event)` in the Events section of `app.js`: resolve the clicked `button.task-delete` via `closest`, read its `li[data-task-id]`, call `deleteTask`, then `saveTasks` and `render`; after rendering, move focus to the next remaining row's delete control, or to `#task-input` when no tasks remain; bind this delegated `click` listener on `#task-list` once inside `init()`
- [X] T020 [P] [US3] Add delete-control styling to `style.css`: distinguishable delete button with visible `:focus-visible` outline and an accessible hit area
- [X] T021 [US3] Validate User Story 3 using quickstart scenarios Q10 and P3 in [quickstart.md](./quickstart.md), plus keyboard-only deletion and post-delete focus behavior; record pass/fail outcomes

**Checkpoint**: User Stories 1–3 work independently.

---

## Phase 6: User Story 4 - Persistence Across Reloads (Priority: P4)

**Goal**: All mutations save automatically without a save action, reloads restore titles,
completion states, and order, and storage failures never break the session.

**Independent Test**: Add two tasks, complete one, delete another, reload, and confirm the
remaining tasks, their order, and completion states are identical; then corrupt the stored value
and confirm the app opens empty with a warning and no uncaught error.

### Implementation for User Story 4

- [X] T022 [US4] Integrate startup restore in `init()` in `app.js`: call `loadTasks()` before the first render, assign the validated array to `state.tasks`, render the persisted order and completion states, and keep an absent key silent (empty list, no warning)
- [X] T023 [US4] Implement storage status handling in `app.js`: maintain `persistenceAvailable`, a `showStorageWarning(message)`/`hideStorageWarning()` pair that toggles `hidden` on `#storage-warning` (`role="status"`), show "Changes can't be saved in this browser, but you can keep using the list." on read/write failure, show "Saved tasks couldn't be loaded, so the list started empty." when `unreadable` is true, and hide the warning only after a subsequent successful write
- [X] T024 [P] [US4] Add `.storage-warning` styling in `style.css`: visually distinct notice above the list using more than color alone, readable at 320 px
- [X] T025 [US4] Centralize persistence in `app.js`: ensure each add, toggle, and delete path calls `saveTasks` exactly once after the in-memory mutation and before the handler returns, that a rejected blank submission performs no write, and that write failure keeps in-memory state and triggers the unavailable warning
- [X] T026 [US4] Validate User Story 4 using quickstart scenarios P1–P4, E1–E3, and E8 in [quickstart.md](./quickstart.md), including the stored value being a bare JSON array of `{id, text, completed}` objects and no uncaught console errors on corrupt data; record pass/fail outcomes

**Checkpoint**: All data operations persist correctly; failure modes degrade gracefully.

---

## Phase 7: User Story 5 - Friendly Empty State (Priority: P5)

**Goal**: A friendly message replaces the blank list when no tasks exist and disappears as soon
as a task is added, returning when the list empties.

**Independent Test**: On a clean start the message is visible with the form still usable; adding
one task hides it; deleting that task shows it again.

### Implementation for User Story 5

- [X] T027 [US5] Implement `updateEmptyState()` in the Render section of `app.js` and call it from `render(tasks)`: remove `hidden` from `#empty-state` exactly when `tasks.length === 0`, restore `hidden` otherwise, and never disable the form or Add control
- [X] T028 [P] [US5] Style `#empty-state` in `style.css`: friendly, muted, centered message with spacing that keeps the form visible and usable at 320 px
- [X] T029 [US5] Validate User Story 5 using quickstart scenarios Q1 and Q11 in [quickstart.md](./quickstart.md), confirming visibility toggling on cold start, first add, and last delete; record pass/fail outcomes

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Constitution-mandated documentation, security/accessibility audits, and full
end-to-end validation

- [X] T030 Documentation pass in `app.js`: ensure every function documents parameters, return value, and failure behavior; add intent comments for validation, id-generation fallback, storage-failure recovery, and focus management (Principle IV)
- [X] T031 [P] Security audit across `index.html`, `style.css`, and `app.js`: confirm no `innerHTML` with task data, no `eval`/`new Function`, no inline event-handler attributes, no external scripts/styles/fonts, and that only `todo_app_tasks` is ever written to storage; fix any findings
- [X] T032 [P] Accessibility audit per quickstart A1–A3: verify label association, per-row accessible names, keyboard tab order (input → Add → checkbox → Delete), visible focus indicators, `role="status"` announcement, and AA contrast; fix any findings
- [X] T033 Run the remaining quickstart checks A4–A6 and E4–E7 in [quickstart.md](./quickstart.md): no network requests beyond the three files, no console errors, 100-task render under 1 second, storage-disabled session behavior, 320 px long-title wrapping, and literal rendering of special characters; fix any failures
- [X] T034 Final review of the three-file deliverable: remove dead code and stray comments, confirm no build step or dependency is required, confirm `python3 -m http.server 8000` serves the app, and confirm the stored array shape matches [contracts/storage-contract.md](./contracts/storage-contract.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001–T003 touch different files and can run in parallel
- **Foundational (Phase 2)**: Depends on T001–T003; BLOCKS all user stories (T004–T007 are all
  in `app.js` and must run in order)
- **User Stories (Phases 3–7)**: Each depends on Foundational completion
  - US1 → US2 → US3 → US4 → US5 in priority order by default
  - US2 and US3 require tasks to exist for testing; use US1 or seed `todo_app_tasks` manually
  - US4's startup restore is required for reload-persistence validation of US1–US3
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Needs Foundational only — creates the task data other stories operate on
- **US2 (P2)**: Needs Foundational; toggles tasks produced by US1 (or seeded data)
- **US3 (P3)**: Needs Foundational; deletes tasks produced by US1 (or seeded data)
- **US4 (P4)**: Needs Foundational and the mutation handlers from US1–US3 to autosave; startup
  restore itself is independent
- **US5 (P5)**: Needs Foundational rendering plus at least add/delete flows to observe toggling

### Within Each User Story

- Domain function before its event handler
- Event handler before the listener binding task
- CSS task for the story runs in parallel with that story's `app.js` work
- Story validation runs last, after implementation

### Parallel Opportunities

- T001, T002, T003 are fully parallel (three different files)
- `app.js` tasks are sequential within and across phases (single file); never run two `app.js`
  tasks concurrently
- T012 (US1 CSS), T016 (US2 CSS), T020 (US3 CSS), T024 (US4 CSS), T028 (US5 CSS) all edit
  `style.css`, so they are parallel only against `app.js` work in the same phase, never against
  each other
- T031 and T032 are parallel audits (read-only across the same files)
- Story phases may be staffed in parallel only if `style.css` edits are coordinated or serialized

---

## Parallel Example: Setup

```bash
# Three independent files:
Task: "Create index.html with the full UI contract markup"
Task: "Create style.css with reset, tokens, layout, focus styles"
Task: "Create app.js module skeleton with constants and section headers"
```

## Parallel Example: User Story 1

```bash
# Run JS implementation sequentially, with the CSS task alongside:
Task: "Implement normalizeTitle/createTask in app.js"
Task: "Implement handleSubmit in app.js (after domain functions)"
Task: "Add task row layout styling to style.css"   # parallel with app.js work
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocking)
3. Complete Phase 3: User Story 1 (add/view)
4. **STOP and VALIDATE** with quickstart Q2–Q6 and P5
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
  [quickstart.md](./quickstart.md) as the verification record.
- `[P]` means different files and no incomplete dependencies — not simply "separate concern".
- All tasks are immediately executable without additional context; contracts define every
  selector, message, and data rule referenced above.
- Commit after each logical group only when the user requests it.
