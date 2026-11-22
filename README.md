# To-Do Application

## 🚀 Live Demo

Check out the live demo here:
👉 **[View Live Site](https://mohamadabusultan.github.io/todo-api/)**

---

### Overview
- **ToDo2 (Frontend)**: Lightweight To-Do web app deployed via GitHub Pages.
- **ToDo1 (Backend)**: REST API built with Node.js and Express.

## Review Issues and Fixes

This is a short record of review work. It is not a test report.

### Completed

- Problem: Git tracked `node_modules`. Fix: Removed it from Git tracking and kept local dependencies.
- Problem: The repository had no root `.gitignore`. Fix: Added rules for dependencies, environment files, logs, and temporary files.
- Problem: The frontend plan had wrong paths and structure details. Fix: Corrected them in `ToDo2/specs/001-todo-list/plan.md`.
- Problem: The frontend file location and server command were unclear. Fix: Clarified in `ToDo2/specs/001-todo-list/plan.md` that the files are in `ToDo2/` and the server runs from that directory.

### Pending (not fixed yet)

- Problem: `ToDo2/specs/001-todo-list/tasks.md` uses paths that assume the repository root. Planned fix: Change them to `ToDo2/` paths.
- Problem: Some task descriptions do not fully match the implementation. Planned fix: Review and correct the affected descriptions.
- Problem: Marking a task complete or incomplete re-renders the list and removes keyboard focus. Planned fix: Preserve or restore keyboard focus after the list re-renders.
- Problem: Delete-focus behavior differs from `tasks.md` and `ui-contract.md`. Planned fix: Align the implementation and the documents.
- Problem: Some completed tasks have no clear test evidence. Planned fix: Add verifiable test evidence or explicitly mark the affected tasks as unverified.
- Problem: The accessibility audit is not fully verified. Planned fix: Check keyboard navigation, focus indicators, contrast, and status announcements.
- Problem: The backend specs do not fully describe the API endpoints and persistence behavior. Planned fix: Update the specs to match the implementation.
- Problem: The root Spec Kit constitution still has template placeholders. Planned fix: Replace them with project-specific content.
- Problem: Some backend plan details and technical references are outdated. Planned fix: Review and update them.
