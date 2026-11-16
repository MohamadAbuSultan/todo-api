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

From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` in the browser. Do not rely on opening `index.html` via
`file://`, because some browsers block module scripts from that origin.

**Reset to a clean state**: DevTools → Application → Local Storage → delete the
`todo_app_tasks` key, then reload.

## Serve/run command reference

| Purpose | Command |
|---------|---------|
| Serve locally | `python3 -m http.server 8000` |
| Open app | `http://localhost:8000/` |
| Inspect stored data | DevTools → Application → Local Storage → `todo_app_tasks` |
| Clear all data | Delete the `todo_app_tasks` key and reload |

## Validation Scenarios

Record pass/fail for each scenario; this record is the change verification required by the
constitution's Definition of Done.

### Core flows

| ID | Scenario | Steps | Expected result | Covers |
|----|----------|-------|-----------------|--------|
| Q1 | Cold start | Clear `todo_app_tasks` and reload | Friendly empty-state message shown; input usable; no console errors | FR-014, US5 |
| Q2 | Add via button | Type "Buy milk", click Add | Task appears in list; input clears; empty state hidden | FR-001, US1 |
| Q3 | Add via Enter | Type "Walk the dog", press Enter | Task appended below existing tasks; input clears | FR-002, US1 |
| Q4 | Whitespace-only | Type spaces/tabs, click Add then press Enter | No task added; list unchanged; no write occurs | FR-003 |
| Q5 | Trimming | Type `"  Buy milk  "`, add | Stored/displayed title is `Buy milk` | FR-004 |
| Q6 | Ordering | Add A, then B, then C | List order is A, B, C; reload preserves order | FR-006, FR-013 |
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
| A4 | No external requests | Reload with DevTools Network tab open | Only `index.html`, `style.css`, and `app.js` load; no third-party or font requests | Constitution |
| A5 | No console errors | Perform all core flows | Console shows no errors | Definition of Done |
| A6 | 100-task performance | Populate 100 tasks (or paste a 100-item array, reload) | List renders and interactions stay responsive; reload restores all within 1 second | SC-003 |

## Expected Artifacts on Disk

```text
index.html
style.css
app.js
```

No other runtime files are required, and no installation step precedes the serve command.

## References

- Task shape and validation: [data-model.md](./data-model.md)
- Storage rules: [contracts/storage-contract.md](./contracts/storage-contract.md)
- DOM and interaction rules: [contracts/ui-contract.md](./contracts/ui-contract.md)
