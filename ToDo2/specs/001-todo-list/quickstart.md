# Quickstart: Simple To-Do List

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-16

Manual end-to-end validation guide. There is no build step and no test runner by design
(constitution: no dependencies/build tools), so every check below is performed in a browser.

## Prerequisites

- A current evergreen browser (Chrome, Firefox, Edge, or Safari) with JavaScript and Local
  Storage enabled.
- Python 3 **or** any static file server already available on the machine. Python is a serving
  convenience only; it is not a project dependency.

## Run

From the repository root, change into the frontend project root `ToDo2/` and start the server
there, so the app is served from the site root:

```bash
cd ToDo2 && python3 -m http.server 8000
```

Open `http://localhost:8000/` in the browser. Do not rely on opening `index.html` via
`file://`, because some browsers block module scripts from that origin.

Serving from the repository root instead would expose `http://localhost:8000/ToDo2/` and break
the relative `style.css` / `app.js` references at the site root.

**Reset to a clean state**: DevTools → Application → Local Storage → delete the
`todo_app_tasks` key, then reload.

## Serve/run command reference

| Purpose | Command |
|---------|---------|
| Serve locally | `cd ToDo2 && python3 -m http.server 8000` |
| Open app | `http://localhost:8000/` |
| Inspect stored data | DevTools → Application → Local Storage → `todo_app_tasks` |
| Clear all data | Delete the `todo_app_tasks` key and reload |

## Validation Scenarios

Record pass/fail for each scenario; this record is the change verification required by the
constitution's Definition of Done.

This guide defines **33 scenarios**: 11 core flows (Q1–Q11), 5 persistence scenarios (P1–P5),
8 edge cases (E1–E8), and 9 accessibility and quality scenarios (A1–A9). The recorded run
below exercises all 33.

### Core flows

| ID | Scenario | Steps | Expected result | Covers |
|----|----------|-------|-----------------|--------|
| Q1 | Cold start | Clear `todo_app_tasks` and reload | Friendly empty-state message shown; input usable; no console errors | FR-014, US5 |
| Q2 | Add via button | Type "Buy milk", click Add | Task appears in list; input clears; empty state hidden | FR-001, US1 |
| Q3 | Add via Enter | Type "Walk the dog", press Enter | Task appended below existing tasks; input clears | FR-002, US1 |
| Q4 | Whitespace-only | Type spaces/tabs, click Add then press Enter | No task added; list unchanged; no write occurs | FR-003 |
| Q5 | Trimming | Type `"  Buy milk  "`, add | Stored/displayed title is `Buy milk` | FR-004 |
| Q6 | Ordering | Add A, then B, then C | List order is A, B, C (reload persistence is covered by P1) | FR-006, US1 |
| Q7 | Complete | Check task B's checkbox | B's title gets strikethrough; A and C unchanged | FR-007–FR-009 |
| Q8 | Uncomplete | Uncheck task B | Strikethrough removed; task active again | FR-008 |
| Q9 | New-task default | Add a task while others are completed | New task is unchecked and unstruck | FR-010 |
| Q10 | Delete one | Delete B with three tasks present | Only B removed; A and C remain in order | FR-011 |
| Q11 | Empty state return | Delete the last remaining task | Empty-state message reappears | FR-014, US5 |

### Persistence

| ID | Scenario | Steps | Expected result | Covers |
|----|----------|-------|-----------------|--------|
| P1 | Add persists | Add two tasks, reload | Both present, same order | FR-012, FR-013 |
| P2 | Toggle persists | Complete one task, reload | Still completed with strikethrough and checked box | FR-013 |
| P3 | Delete persists | Delete a task, reload | Deleted task absent; others unchanged | FR-012, FR-013 |
| P4 | Stored format | After adding, inspect `todo_app_tasks` | JSON array of objects with exactly `id`, `text`, `completed` | Storage contract |
| P5 | Duplicate titles | Add "Task" twice | Two independent rows; toggling/deleting one leaves the other intact | FR-017 |

### Edge cases and resilience

| ID | Scenario | Steps | Expected result | Covers |
|----|----------|-------|-----------------|--------|
| E1 | Corrupt JSON | Set `todo_app_tasks` to `not-json`, reload | Empty list plus warning; app usable; no uncaught error | FR-015 |
| E2 | Non-array value | Set key to `{}`, reload | Empty list plus warning | FR-015 |
| E3 | Mixed valid/invalid | Set key to an array containing valid tasks and `null`/`{"id":1}` entries, reload | Only valid tasks render; no crash | FR-015 |
| E4 | Storage unavailable | Block site data (or set the browser to disallow local storage), reload, add a task | Task appears in session; warning states changes won't be saved; app stays usable | FR-016 |
| E5 | Quota/write failure | With site data blocked or storage full, toggle and delete tasks | Changes apply in session; warning remains; no crash | FR-016 |
| E6 | Long title | Add a ~500-character title; set viewport to 320 px wide | Title wraps; no horizontal page scrolling; delete/checkbox remain reachable | Spec edge case, SC-006 |
| E7 | Special characters | Add `<img src=x onerror=alert(1)> & "quotes" 😀` | Text displayed literally; no dialog, image, or markup execution | FR-019 |
| E8 | Cold start without key | Delete key, reload | Empty state; no warning about unreadable data | FR-014 |

### Accessibility and quality

| ID | Scenario | Steps | Expected result | Covers |
|----|----------|-------|-----------------|--------|
| A1 | Keyboard only | Using Tab/Shift+Tab/Enter/Space only, add, complete, and delete a task | All actions succeed; focus indicator always visible; order is input → Add → row checkbox → row Delete | FR-018, SC-005 |
| A2 | Accessible names | Inspect controls in the accessibility tree | Input labeled; each delete button name includes its task title; checkbox name is the task text | UI contract |
| A3 | Status announcement | Trigger the storage warning | Announced via `role="status"` without moving focus | UI contract |
| A4 | No external requests | Reload with DevTools Network tab open | No third-party, font, or cross-origin requests; the only same-origin requests are `index.html`, `style.css`, `app.js`, and the browser's automatic `/favicon.ico` probe | Constitution |
| A5 | No console errors | Perform all core flows | Console shows no errors | Definition of Done |
| A6 | 100-task performance | Populate 100 tasks (or paste a 100-item array, reload) | List renders and interactions stay responsive; reload restores all within 1 second | SC-003 |
| A7 | Focus retained on toggle | Tab to a row checkbox, press Space to toggle it | The list re-renders but keyboard focus stays on the same task's checkbox (the focus ring is still visible) | SC-005, UI contract |
| A8 | Focus after delete | Delete the middle row, then the last remaining row, then the only row | Focus moves to the row now at the deleted index (next row, else previous row); it moves to the task input only when the list becomes empty | UI contract |
| A9 | Hostile restored id | Store a task whose `id` contains `"` and toggle it | The row selector is built safely, the toggle applies, and focus stays on that task's checkbox — no uncaught error | FR-015, FR-019 |

## Expected Artifacts on Disk

```text
ToDo2/index.html
ToDo2/style.css
ToDo2/app.js
```

These are the only runtime files, all inside the frontend project root `ToDo2/`. No other
runtime file is required, and no installation step precedes the serve command.

## Verification Record

Record pass/fail for each scenario; this record is the change verification required by the
constitution's Definition of Done (`constitution.md`, "Verification without frameworks"). A
validation task in [tasks.md](./tasks.md) is only complete once its scenarios are recorded here.

### Latest recorded run

| Field | Value |
|-------|-------|
| Date | 2026-11-22 |
| Browser | Firefox 159.0 (headless), WebDriver BiDi |
| Server | `cd ToDo2 && python3 -m http.server` (frontend project root) |
| Method | Automated browser scenario run driving the real DOM and Local Storage; storage-failure scenarios (E4, E5) were exercised on a same-origin copy of the app with Local Storage access stubbed to throw |
| Harness | WebDriver BiDi client (no project dependencies, kept outside the repository) |
| Coverage | **33 named scenarios** (Q1–Q11, P1–P5, E1–E8, A1–A9), all PASS |
| Test count | **36 automated checks in total**: 34 browser checks + 2 storage-failure checks |

The 33 named scenarios are covered by 36 automated checks: 34 browser checks plus 2
storage-failure checks. The 34 browser checks cover 31 scenarios — every scenario except E4
and E5, which the 2 storage-failure checks cover. Two scenarios are backed by more than one
browser check: **A7** is checked twice (toggle and untoggle) and **A8** is checked three times
(delete the middle row, the last row, and the only row), accounting for the 3 checks beyond
one-per-scenario. **A1** (tab order) and **A9** (hostile id) each have a single check. Every
named scenario has a recorded result, and every recorded check maps to a named scenario.

| ID | Result | Notes |
|----|--------|-------|
| Q1 | PASS | Empty state shown, input usable, no warning, 0 rows |
| Q2 | PASS | Task appended, input cleared, empty state hidden |
| Q3 | PASS | Enter submitted the native form; task appended below existing tasks |
| Q4 | PASS | Whitespace-only input created no task and wrote no storage value |
| Q5 | PASS | Title trimmed in both display and storage |
| Q6 | PASS | Order A, B, C preserved in session |
| Q7 | PASS | Only task B completed; computed `text-decoration-line` was `line-through` |
| Q8 | PASS | Unchecking restored the active state |
| Q9 | PASS | New task created unchecked and unstruck |
| Q10 | PASS | Only the middle task was removed; order preserved |
| Q11 | PASS | Empty-state message reappeared after the last task was deleted |
| P1 | PASS | Two tasks persisted across reload in the same order |
| P2 | PASS | Completed state persisted across reload |
| P3 | PASS | Deleted task stayed absent across reload |
| P4 | PASS | Stored value is a bare JSON array whose objects have exactly `id`, `text`, `completed` |
| P5 | PASS | Duplicate titles produced two independent rows |
| E1 | PASS | Corrupt JSON produced an empty list plus the "couldn't be loaded" warning, no uncaught error |
| E2 | PASS | Non-array value produced an empty list plus the warning |
| E3 | PASS | Only the valid elements rendered; no warning for a partially valid array |
| E4 | PASS | Storage-failure check (not a browser check): blocked storage — empty list, unavailable warning, task usable in session, no crash |
| E5 | PASS | Storage-failure check (not a browser check): write failure — toggle and delete applied in session, warning stayed visible, no crash |
| E6 | PASS | 500-character title wrapped at 320 px with no horizontal overflow; controls reachable |
| E7 | PASS | Special characters rendered literally; no `img` element was created |
| E8 | PASS | Cold start with no key: empty state, no warning |
| A1 | PASS | Tab order observed: input → Add → row checkbox → row Delete |
| A2 | PASS | Input labeled; delete button name `Delete task: <title>`; checkbox name = task text |
| A3 | PASS | Warning used `role="status"`, appeared without moving focus |
| A4 | PASS | No third-party or cross-origin requests; only the three project files plus the browser's `/favicon.ico` probe |
| A5 | PASS | No console errors and no uncaught page exceptions during the run |
| A6 | PASS | 100 tasks rendered and restored well under 1 second |
| A7 | PASS | After the focus-retention fix, keyboard focus stays on the toggled checkbox (`activeElement` = `input.task-checkbox`) instead of falling back to `body` |
| A8 | PASS | Delete focus: middle row → next row's Delete; last row → previous row's Delete; only row → task input |
| A9 | PASS | A restored id containing `"` does not throw when building the row selector; the toggle applies and focus is retained |

### Checks performed outside the browser

Six further checks were run outside the browser. These are **not** part of the 36 automated
checks counted above.

| Check | Result | Notes |
|-------|--------|-------|
| `node --check ToDo2/app.js` | PASS | Module parses without syntax errors |
| Security grep over `ToDo2/app.js`, `ToDo2/index.html`, `ToDo2/style.css` | PASS | No `innerHTML`, `eval(`, `new Function`, inline `on*=` handlers, or `http(s)://` asset references |
| Storage-key audit | PASS | `todo_app_tasks` is the only key read or written; no probe key is created |
| AA contrast spot check on the token palette | PASS | All text/background pairs in `style.css` measured ≥ 4.5:1 (lowest 6.02:1) |
| Serve-location check | PASS | Serving from `ToDo2/` returns HTTP 200 for `/`, `/app.js`, `/style.css`; serving from the repository root returns 404 for the root-relative `/app.js` |
| Negative control for the focus fix | PASS | With `CSS.escape` removed, the A9 selector check fails (`DOMException`) and focus drops to `body`; with the fix both pass — confirming the check detects a real regression |

### Reproducing the run

The browser checks were executed by a WebDriver BiDi harness that lives **outside the
repository** (it adds no dependency to the project, as the constitution requires). It consists
of a minimal WebSocket BiDi client plus two scenario scripts:

| File | Purpose | Checks |
|------|---------|--------|
| `bidi.mjs` | Minimal WebDriver BiDi client (Node built-in `WebSocket`, no packages) | — |
| `verify.mjs` | Drives the real DOM and Local Storage of the served app | 34 |
| `verify-storage.mjs` | Drives the same-origin copy with Local Storage stubbed to throw | 2 |

The harness is an ad-hoc tool kept outside the version-controlled tree and is therefore not
retained in the repository; the counts recorded above were reproduced by re-running it.

### Not verified in an automated run

- E4/E5 were exercised against a same-origin copy of `app.js` with Local Storage stubbed to
  throw, not against a browser's real "block site data" setting. They are therefore counted as
  storage-failure checks rather than browser checks.
- The `file://` restriction and behavior in Chrome, Edge, and Safari were not exercised; only
  Firefox was available in this environment.
- Screen-reader announcement quality was not verified beyond the `role="status"` attribute and
  the absence of focus movement.

## References

- Task shape and validation: [data-model.md](./data-model.md)
- Storage rules: [contracts/storage-contract.md](./contracts/storage-contract.md)
- DOM and interaction rules: [contracts/ui-contract.md](./contracts/ui-contract.md)
