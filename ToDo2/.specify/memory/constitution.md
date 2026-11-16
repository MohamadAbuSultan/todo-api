<!--
Sync Impact Report
==================
Version change: (unratified template scaffold) → 1.0.0
Rationale: Initial adoption. The constitution previously contained only the
unmodified core template placeholders, so this is the first ratified version.

Modified principles:
- [PRINCIPLE_1_NAME] → I. Vanilla, Framework-Free Foundation
- [PRINCIPLE_2_NAME] → II. Local-First Persistence
- [PRINCIPLE_3_NAME] → III. Modular and Semantic Architecture
- [PRINCIPLE_4_NAME] → IV. Explicit Documentation
- [PRINCIPLE_5_NAME] → V. Simplicity and Lightweight Delivery

Added sections:
- Technical Constraints (was [SECTION_2_NAME])
- Development Workflow and Quality Gates (was [SECTION_3_NAME])
- Governance (filled in from placeholder guidance)

Removed sections:
- None (template example comments were replaced with concrete guidance)

Templates requiring follow-up:
- None. Dependent templates read this file at runtime and require no edits.

Deferred items:
- None. RATIFICATION_DATE is set to the initial adoption date (2026-11-16).
-->

# ToDo2 Constitution

## Core Principles

### I. Vanilla, Framework-Free Foundation

The application MUST be built with native platform primitives only: HTML5, CSS3, and
ECMAScript 2015+ (ES6+) JavaScript. The runtime MUST NOT load external libraries,
frameworks, UI kits, CSS frameworks, icon packs, or CDN-hosted assets. The project MUST NOT
require a build tool, bundler, transpiler, package manager dependency, or preprocessor to run.
Any proposed dependency, polyfill, or tool introduces a governance violation and MUST be
rejected unless this constitution is amended first.

**Rationale**: Removing frameworks and toolchains eliminates supply-chain exposure, keeps the
artifact auditable by reading source files directly, and guarantees the app runs by opening it
in a browser or serving static files.

### II. Local-First Persistence

All application data MUST persist exclusively in the browser's Local Storage. The application
MUST NOT transmit user data to any server, third-party service, or analytics endpoint. All
reads and writes MUST go through a single persistence module that owns the storage key
namespace, JSON serialization, and schema versioning. The persistence layer MUST handle
unavailable or blocked storage (for example, private-browsing quotas or disabled storage)
without crashing, MUST validate and migrate stored payloads whose version is outdated, and
MUST recover to an empty, well-defined state when stored data is corrupt.

**Rationale**: A single storage boundary keeps data handling consistent, testable, and
inspectable, and prevents silent data loss when schemas change.

### III. Modular and Semantic Architecture

JavaScript MUST be organized as ES modules with a clear separation between domain logic,
state management, persistence, and DOM rendering. No module may reach into another module's
internal state; interaction MUST occur through exported functions or events. UI markup MUST
use semantic HTML5 elements (for example, `main`, `header`, `nav`, `section`, `form`,
`ul`/`li`, `button`) rather than generic containers where a semantic element exists. Every
interactive control MUST be keyboard operable, MUST expose an accessible name, and MUST not
rely on color alone to convey meaning. User-supplied text MUST be inserted with
`textContent` or equivalent, never through `innerHTML`, `eval`, `new Function`, or inline
event-handler attributes.

**Rationale**: Modular boundaries keep each unit independently understandable and replaceable;
semantic markup preserves accessibility and document structure without extra code.

### IV. Explicit Documentation

Every module MUST begin with a short comment stating its responsibility and its public
exports. Non-obvious logic — persistence migrations, edge-case guards, ordering constraints,
and cross-module contracts — MUST carry an explanatory comment describing intent rather than
restating the code. Every exported function MUST document its parameters, return value, and
any thrown or recoverable error. Comments and identifiers MUST stay in sync with the code;
stale comments are defects.

**Rationale**: This project is read directly as source, so comments are the primary
maintenance interface and the main defense against regressions.

### V. Simplicity and Lightweight Delivery

The application MUST stay small enough to be served as static files with no build step. A
feature MUST be implemented in the simplest way that satisfies its specification; speculative
abstractions, unused configuration, dead code, and premature optimization MUST be removed
before completion. New files MUST have a clear single responsibility, and each addition MUST
justify its weight against the total delivered size. Progressive enhancement is REQUIRED:
core content and primary actions MUST remain usable when scripting-intensive enhancements are
degraded.

**Rationale**: Lightweight delivery keeps first load fast on low-end devices and keeps the
codebase comprehensible without architectural ceremony.

## Technical Constraints

- **Platform**: HTML5 markup, CSS3 styling, and ES6+ JavaScript executed natively by the
  browser. ES module syntax is permitted because browsers support it natively.
- **No third-party runtime code**: no libraries, frameworks, shims, or remote scripts,
  stylesheets, fonts, or images. All assets MUST be local and authored in this repository.
- **No build pipeline**: no bundlers, transpilers, minifiers, CSS preprocessors, or task
  runners are required or permitted as a prerequisite to running or reviewing the app.
- **Storage**: Local Storage is the only persistence mechanism. Cookies, IndexedDB, the
  Cache API, and remote persistence MUST NOT be introduced without amending this constitution.
- **Security and privacy**: the app MUST NOT use `eval`, `new Function`, inline event handlers,
  or string-built markup that interpolates user data. The app MUST NOT emit user data to the
  network, logs intended for transmission, or third-party endpoints.
- **Accessibility baseline**: WCAG 2.1 Level AA for color contrast and keyboard operability,
  with a visible focus indicator on every focusable control.

## Development Workflow and Quality Gates

- **Verification without frameworks**: because no test framework is permitted, every change
  MUST be verified manually in a current evergreen browser and MUST document the manual steps
  performed, including reload-persistence checks and a storage-cleared cold start.
- **Review checklist**: reviewers MUST confirm no external dependency was added, no build step
  became necessary, all data access flows through the persistence module, user input is never
  injected as HTML, and newly added logic is commented per Principle IV.
- **Schema changes**: any change to persisted data shape MUST include a migration path from the
  previous schema version and MUST be tested against an existing stored payload.
- **Change scope**: changes MUST stay within the stated feature specification. Unrelated
  refactors, dependency additions, and architectural rewrites MUST be proposed as separate
  work rather than folded into a feature change.
- **Definition of done**: a change is complete only when it runs from static files, persists
  correctly across reload, is keyboard usable, and passes the review checklist above.

## Governance

This constitution supersedes all other development practices for this project. When guidance
in a specification, plan, or task list conflicts with this document, this document prevails.

Amendments MUST be proposed as a written change to this file, MUST state the motivation and
the affected principles, and MUST include a migration note when the change invalidates
existing data, file layout, or running artifacts. Amendments take effect once merged into this
file; dependent templates and commands read it at runtime and require no separate update.

Versioning follows semantic versioning: MAJOR for removal or redefinition of a principle or for
any backward-incompatible governance change; MINOR for a new principle or section, or a
material expansion of existing guidance; PATCH for clarifications, wording fixes, and
non-semantic refinements.

Compliance review is mandatory for every change: reviewers MUST verify each principle and the
Technical Constraints, and any violation MUST be either corrected or recorded as an approved
amendment before merge. Complexity that conflicts with Principle V MUST be justified in
writing, and unjustified complexity MUST be removed.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
