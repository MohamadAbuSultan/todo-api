# Feature Specification: Minimal To-Do API

**Feature Branch**: `001-todo-api`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Build a minimal Node.js and Express To-Do API with in-memory array storage, supporting GET /todos and POST /todos endpoints, input validation for the title, and proper HTTP status codes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a To-Do Item (Priority: P1)

A client submits a to-do title to the service and receives back a newly created to-do item, so that the item can be tracked.

**Why this priority**: Creating items is the core purpose of the service; without it there is no to-do functionality at all.

**Independent Test**: Submit a single request containing a valid title and confirm a new item is returned and retrievable; delivers a working create capability on its own.

**Acceptance Scenarios**:

1. **Given** the service is running and no items exist, **When** a client submits a request with a non-empty title, **Then** the item is accepted, assigned a unique identifier, and returned with a success status indicating the resource was created.
2. **Given** the service is running, **When** a client submits a request whose title is missing, blank, or whitespace-only, **Then** the request is rejected with a validation error status and no item is stored.
3. **Given** the service is running, **When** a client submits a request with a title that is not text (for example, a number or an object), **Then** the request is rejected with a validation error status and no item is stored.

---

### User Story 2 - List To-Do Items (Priority: P1)

A client requests the full collection of stored to-do items and receives them in a consistent, ordered form, so that existing work can be reviewed.

**Why this priority**: Viewing items is essential to make the stored data useful; it is part of the minimal viable product alongside creation.

**Independent Test**: Create one or more items, then request the collection and confirm every created item is returned; delivers read capability independently.

**Acceptance Scenarios**:

1. **Given** the service contains one or more to-do items, **When** a client requests the collection, **Then** all stored items are returned with a success status.
2. **Given** the service contains no to-do items, **When** a client requests the collection, **Then** an empty collection is returned with a success status rather than an error.

---

### Edge Cases

- What happens when a request body is missing entirely or is not valid JSON? The service responds with a client-error status and no item is stored.
- What happens when the title consists only of leading/trailing whitespace? The title is treated as empty and the request is rejected.
- What happens when the title is extremely long? It is still accepted as long as it is non-empty text; no explicit length cap is imposed in this minimal scope.
- What happens when the same title is submitted twice? Duplicate titles are permitted; each submission creates a distinct item.
- What happens when the service restarts? In-memory items are discarded, since persistence is out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The service MUST expose an endpoint to create a to-do item that accepts a title supplied by the client.
- **FR-002**: The service MUST validate that a submitted title is present and is non-empty after trimming surrounding whitespace; requests failing this check MUST be rejected.
- **FR-003**: The service MUST assign a unique identifier to every successfully created item.
- **FR-004**: The service MUST expose an endpoint to retrieve all stored to-do items.
- **FR-005**: The service MUST store to-do items in process memory for the lifetime of the running service.
- **FR-006**: The service MUST return a success status when an item is created and when the collection is retrieved.
- **FR-007**: The service MUST return a client-error status when input validation fails, and MUST NOT store the invalid item.
- **FR-008**: The service MUST return a client-error status for malformed request bodies or missing bodies instead of crashing.
- **FR-009**: The service MUST include the stored item's identifier and title in the create response, and MUST include each item's identifier and title in the list response.
- **FR-010**: The service MUST respond to requests with structured content (a readable representation of items and errors) rather than an empty body.

### Key Entities

- **To-Do Item**: Represents a unit of work to be tracked. Key attributes: a unique identifier assigned at creation time, and a title describing the work.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A valid create request succeeds on the first attempt and the created item can be retrieved immediately afterward.
- **SC-002**: 100% of create requests with a missing, blank, or non-text title are rejected without storing an item.
- **SC-003**: A request to list items returns every stored item in the order they were created.
- **SC-004**: Every documented error case (invalid title, malformed body, missing body) results in a client-error response and the service remains available for subsequent valid requests.
- **SC-005**: A client can create and retrieve to-do items using only the two documented endpoints, without any additional configuration.

## Assumptions

- The service runs locally for development and testing; no deployment, hosting, or authentication is required for this scope.
- In-memory storage is acceptable and intentionally chosen for simplicity; data is not expected to survive a service restart.
- The client is expected to send and receive structured data (for example, JSON) over HTTP.
- No update, delete, filtering, pagination, or persistence features are required.
- Errors are surfaced with an appropriate status code and a human-readable message; no specific error body schema is mandated beyond being readable.
- Node.js with Express is the implementation technology named by the requester, but the specification itself is expressed in terms of the API's observable behavior.