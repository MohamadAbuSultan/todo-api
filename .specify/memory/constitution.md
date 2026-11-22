# ToDo Application Constitution

## Core Principles

### I. Documentation Accuracy

Documentation MUST describe implemented behavior, not intended or aspirational behavior. Every
endpoint, status code, persistence guarantee, and operational claim in specs, plans, contracts,
checklists, and guides MUST be verifiable against the code and tests. Unsupported claims MUST be
removed rather than deferred.

### II. Minimal Dependencies, No Build Step

The backend runs directly on Node.js with `node src/app.js`; the frontend is served as static
files. Neither project requires a bundler, transpiler, or build script. New dependencies MUST
justify their runtime value; a database or application-managed file storage is explicitly out of
scope.

### III. Tested Observable Behavior

The documented API surface MUST be covered by the Node.js built-in test runner (`node --test`)
through contract, integration, and unit tests. A task or document may be marked complete only
after the relevant checks pass. Tests MUST verify existing behavior without changing it.

### IV. Explicit Persistence and Failure Semantics

Backend data is held in process memory by default and is lost on restart. Optional persistence
MUST be documented with the exact runtime flags it requires, and MUST be presented as an optional
runtime capability, not a project-managed storage system. Storage read/write failures MUST be
handled without failing an API request, and this behavior MUST be documented.

### V. API Contract Independent of Auxiliary Demos

The REST API is the core backend contract. The browser page served by the backend and the
separately deployed `ToDo2` frontend are auxiliary demos with their own localStorage; they MUST
NOT be treated as part of the API contract or as evidence of API behavior.

## Technical Constraints

- Backend: Node.js 18+, Express 4, `uuid`; CommonJS; `node:test` / `node:assert`; ESLint and Prettier.
- Frontend: vanilla HTML/CSS/JS, no build tool, no external runtime dependencies.
- Not implemented and not documented as available: database, application file storage,
  authentication, health checks, performance monitoring, file logging, rate limiting, CORS, and
  input-sanitization layers.

## Development Workflow and Quality Gates

1. Run `cd ToDo1 && npm install` before local work; no build step exists or is required.
2. Run `npm test`, `npm run lint`, and `npm run format:check` from `ToDo1/` before declaring work
   complete.
3. Update the feature spec, plan, data model, contract, and quickstart in the same change as any
   behavior change.
4. Keep `tasks.md` statuses tied to verified work, not to the act of rewriting the task list.
5. Do not commit or push without explicit approval.

## Governance

This constitution supersedes ad-hoc conventions in this repository. Amendments MUST update the
version and amendment date, and MUST remove any documentation that contradicts them. Complexity
beyond these principles MUST be justified in the implementation plan before it is introduced.

**Version**: 1.0.0 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
