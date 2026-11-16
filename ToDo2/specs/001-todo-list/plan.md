# Implementation Plan: Simple To-Do List

**Branch**: `001-todo-list` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-todo-list/spec.md`

## Summary

Deliver a single-page to-do list as three root-level static files: `index.html`, `style.css`,
and `app.js`. Users add, view, complete/uncomplete, and delete tasks; every mutation is
persisted automatically to the Local Storage key `todo_app_tasks` as a JSON array of
`{ id, text, completed }` objects. A friendly empty state appears when no tasks exist.

The technical approach is a single native ES module (`app.js`) loaded with
`<script type="module">`, organized internally into clearly separated persistence, state,
domain, rendering, and event-wiring sections. Rendering rebuilds the list from state using
`document.createElement` and `textContent` only. No libraries, no build step, no network
assets.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2015+ (ES6+), executed natively by the browser

**Primary Dependencies**: None (no libraries, frameworks, fonts, or remote assets)

**Storage**: Browser Local Storage; single key `todo_app_tasks`; value is a JSON array of task
objects `{ id: string, text: string, completed: boolean }`

**Testing**: No test framework permitted; manual browser verification per
[quickstart.md](./quickstart.md), including reload-persistence and cold-start checks

**Target Platform**: Modern evergreen desktop and mobile browsers with JavaScript and Local
Storage enabled; served as static files (for example, `python3 -m http.server`)

**Project Type**: Static client-side web application (single project)

**Performance Goals**: Full list render in under 1 second with 100 tasks; interactions feel
immediate (well under 100 ms of script work for typical lists)

**Constraints**: Three files in the repository root; no build pipeline; no external runtime
code or assets; no network transmission of user data; all DOM writes use safe text insertion

**Scale/Scope**: One local user, one task list, roughly 100–500 tasks, one screen, English UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Principle / Constraint | Assessment | Result |
|------|------------------------|------------|--------|
| G1 | I. Vanilla, Framework-Free Foundation | Only HTML5, CSS3, and ES6+ are used. Three static files, no dependencies, no build tool, no CDN assets. | PASS |
| G2 | II. Local-First Persistence | All reads/writes go through one internal `storage` section in `app.js` that owns the `todo_app_tasks` key, JSON serialization, and validation. No network calls. Storage failures are caught, the session continues, and the user is informed. Schema is implicitly version 1; a `SCHEMA_VERSION` constant and `migrateTask`/validation path exist so incompatible payloads resolve to a safe empty state rather than a crash. A stored version field is intentionally omitted to preserve the user-mandated array shape. | PASS with note |
| G3 | III. Modular and Semantic Architecture | One ES module mandated by the three-file layout, divided into explicit persistence, state, domain, render, and events sections with no cross-section reach-in. Semantic `header`, `main`, `form`, `label`, `ul`/`li`, `button`; native checkbox; keyboard operable; accessible names; user text rendered with `textContent` only. | PASS with note |
| G4 | IV. Explicit Documentation | `app.js` starts with a module-responsibility header; every function documents parameters, return value, and failure behavior; non-obvious logic (validation, storage failure recovery, id generation fallback) carries intent comments. | PASS |
| G5 | V. Simplicity and Lightweight Delivery | Three files, no abstractions beyond the required separation, no future-facing features (no filtering, sorting, editing, undo). Progressive enhancement keeps the form and task controls operational. | PASS |
| G6 | Security and privacy constraints | No `eval`, `new Function`, inline handlers, or `innerHTML` interpolation of user data. Only local storage; no analytics or remote requests. | PASS |
| G7 | Accessibility baseline | Native form controls, label association, visible `:focus-visible` styling, delete button accessible name includes the task title, contrast targets WCAG 2.1 AA. | PASS |
| G8 | Workflow and quality gates | Manual verification steps are documented in `quickstart.md`; storage schema changes require a migration path; change scope stays within the spec. | PASS |

No unresolved gate violations. The two notes above are design decisions, not departures:
the single-module and array-only shapes are explicitly required by the user, and both retain
the constitution's intent (single persistence boundary, safe recovery from incompatible data).

**Post-Design Re-Check (after Phase 1)**: PASS. Contracts confirm one storage boundary, a fixed
task shape with validation, safe text-only rendering, and no additional files beyond the three
declared deliverables. No complexity justification is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-list/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── storage-contract.md
│   └── ui-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
index.html               # Semantic page shell, task form, list container, empty state, warning
style.css                # All presentation: layout, task states, empty state, focus, responsive
app.js                   # Single ES module: storage, state, domain, render, events, init
```

Internal layout of `app.js` (sections, not separate files):

```text
app.js
├── Constants          # STORAGE_KEY = 'todo_app_tasks', SCHEMA_VERSION = 1, selectors
├── Storage            # loadTasks(), saveTasks(tasks), parseTasks(raw)
├── State              # tasks array, persistenceAvailable flag
├── Domain             # normalizeTitle(), createTask(), toggleTask(), deleteTask()
├── Render             # render(), renderTask(task), updateEmptyState()
└── Events / Init      # bindEvents(), init()
```

**Structure Decision**: Single static web project at the repository root, exactly as required
by the user. No `src/`, `backend/`, or `tests/` directories are created. The single ES module
keeps the three-file contract while preserving the constitution's separation-of-concerns
requirement through documented internal sections.

## Complexity Tracking

> No constitution violations require justification. No additional projects, layers, or
> dependencies are introduced.
