# Feature Specification: Minimal To-Do API

**Feature Branch**: `001-todo-api`

**Created**: 2026-11-13

**Status**: Implemented

**Last updated**: 2026-11-22

**Input**: User description: "Build a minimal Node.js and Express To-Do API with in-memory array storage, supporting GET /todos and POST /todos endpoints, input validation for the title, and proper HTTP status codes."

**Implemented scope**: The delivered service also supports update and delete operations and optional
runtime Web Storage persistence. These are documented as User Stories 3–4 and FR-011–FR-014.

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

1. **Given** the service contains one or more to-do items, **When** a client requests the collection, **Then** all stored items are returned in creation order with a success status.
2. **Given** the service contains no to-do items, **When** a client requests the collection, **Then** an empty collection is returned with a success status rather than an error.

---

### User Story 3 - Update a To-Do Item (Priority: P2)

A client replaces the title of an existing item so that mistakes can be corrected without deleting and recreating the item.

**Why this priority**: Update extends the create/list core without adding new state or relationships; it is useful but not required for the minimal create-and-list flow.

**Independent Test**: Create one item, update its title, and confirm the item's identifier is unchanged and the list reflects the new title.

**Acceptance Scenarios**:

1. **Given** an item exists, **When** a client submits a valid title for its identifier, **Then** the service returns the updated item with a success status, the title is trimmed, the identifier is unchanged, and a subsequent list shows the new title.
2. **Given** an item exists, **When** a client submits a title that is missing, blank, whitespace-only, or not text, **Then** the request is rejected with a validation error status and the stored item is unchanged.
3. **Given** no item has the requested identifier, **When** a client submits a valid title, **Then** the request is rejected with a not-found status and no item is created.

**Note**: The title field is required. The operation replaces the title only; it does not support
partial updates or any other fields.

---

### User Story 4 - Delete a To-Do Item (Priority: P2)

A client removes an existing item so that completed or mistaken entries can be cleared.

**Why this priority**: Like update, delete builds on the existing collection without new concepts, but is not needed for the minimal create-and-list flow.

**Independent Test**: Create one item, delete it, and confirm the response contains the deleted item and a subsequent list is empty.

**Acceptance Scenarios**:

1. **Given** an item exists, **When** a client requests its deletion, **Then** the service returns the deleted item with a success status and a subsequent list no longer contains it.
2. **Given** no item has the requested identifier, **When** a client requests deletion, **Then** the request is rejected with a not-found status and the collection is unchanged.

**Note**: Delete takes no request body.

---

### Edge Cases

- What happens when a request body is missing entirely, is malformed JSON, or is not a JSON object? The service responds with a client-error status, stores nothing, and remains available. A JSON array reaches the object check and returns `Request body must be a JSON object`; a JSON primitive (string, number, boolean, or null) is rejected by JSON parsing as `Invalid JSON body`.
- What happens when the title consists only of leading/trailing whitespace? It is trimmed and treated as empty, so the request is rejected.
- What happens when the title is extremely long? It is still accepted as long as it is non-empty text; no explicit length cap is imposed in this minimal scope.
- What happens when the same title is submitted twice? Duplicate titles are permitted; each submission creates a distinct item.
- Are identifiers validated as UUIDs on input? No. Identifiers are opaque strings; the service generates UUID v4 values by default, but an arbitrary identifier simply resolves to a not-found response when no item matches.
- What happens when PATCH has both an invalid title and an unknown identifier? The title is validated first, so the request is rejected as a validation error rather than a not-found error.
- What happens when a method has no route for the requested path (for example, `PUT /todos` or `DELETE /todos`)? The service returns a structured 404 response; it does not return 405. Automatic `HEAD` and `OPTIONS` handling by the HTTP framework is not part of this contract.
- What happens when the service restarts? By default items are discarded because data is held only in process memory. When runtime Web Storage persistence is enabled and configured, items are restored on the next start.
- What happens when persistence is unavailable, corrupt, or cannot be written? The service logs a warning and continues in memory: invalid stored entries are skipped, invalid JSON or non-array data starts from an empty list, and a failed write does not fail the originating API request.
- Is the browser page served at `/` part of this API? No. It is an auxiliary demo that keeps its own data in the browser's localStorage; it makes no API calls. The separately deployed `ToDo2` frontend is likewise a browser-only demo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The service MUST expose an endpoint to create a to-do item that accepts a title supplied by the client.
- **FR-002**: The service MUST validate that a submitted title is present, is text, and is non-empty after trimming surrounding whitespace; requests failing this check MUST be rejected.
- **FR-003**: The service MUST assign a unique identifier to every successfully created item.
- **FR-004**: The service MUST expose an endpoint to retrieve all stored to-do items.
- **FR-005**: The service MUST hold to-do items in process memory for the lifetime of the running service.
- **FR-006**: The service MUST return a success status when an item is created (201) and when the collection is retrieved (200).
- **FR-007**: The service MUST return a client-error status when input validation fails, and MUST NOT store the invalid item.
- **FR-008**: The service MUST return a client-error status for malformed request bodies, non-object bodies, or missing bodies instead of crashing.
- **FR-009**: The service MUST include the stored item's identifier and title in the create response, and MUST include each item's identifier and title in the list response.
- **FR-010**: The service MUST respond to requests with structured content (a readable representation of items and errors) rather than an empty body.
- **FR-011**: The service MUST expose an endpoint that replaces the title of an item identified by an opaque identifier. The title MUST be required and normalized; the identifier MUST be preserved; the updated item MUST be returned with a success status.
- **FR-012**: The service MUST expose an endpoint that deletes an item identified by an opaque identifier and returns the deleted item with a success status. The endpoint MUST NOT require a request body.
- **FR-013**: Update and delete requests for an unknown identifier MUST be rejected with a not-found status and MUST NOT change the collection.
- **FR-014**: Persistence MUST be optional: items stay in memory by default; when the runtime provides and is configured for Web Storage, items MUST be restored on start and saved after changes. Unavailable, corrupt, or failing persistence MUST NOT prevent in-memory operation or fail the originating request.
- **FR-015**: Methods without a defined route for a path MUST return a structured 404 response rather than a 405 response.

### Key Entities

- **To-Do Item**: Represents a unit of work to be tracked. Key attributes: an opaque identifier (generated as a UUID v4 by default, immutable for the item) and a required, whitespace-trimmed title.
- **Error response**: A readable object with a single `error` message, used for validation, not-found, and unrouted-request failures.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A valid create request succeeds on the first attempt and the created item can be retrieved immediately afterward.
- **SC-002**: 100% of create requests with a missing, blank, or non-text title are rejected without storing an item.
- **SC-003**: A request to list items returns every stored item in the order they were created.
- **SC-004**: Every documented error case (invalid title, malformed body, non-object body, missing body, unknown identifier, unsupported method) results in a client-error response and the service remains available for subsequent valid requests.
- **SC-005**: A client can create, list, update, and delete to-do items using only the documented endpoints, without any additional configuration.
- **SC-006**: Update requires a title, preserves the identifier, and returns the updated item; delete returns the deleted item; both return 404 for an unknown identifier.
- **SC-007**: Observed persistence matches the documented behavior: items are lost on restart with default settings, are restored when optional runtime Web Storage persistence is configured, and storage failures never fail an API request.

## Assumptions

- The service runs locally for development and testing; no deployment, hosting, or authentication is required for this scope.
- In-memory storage is the intentional default; optional persistence is a runtime capability and not an application-managed database or file-storage system.
- The client is expected to send and receive structured data (for example, JSON) over HTTP.
- Filtering, pagination, sorting, authentication, health checks, performance monitoring, and a build step are out of scope.
- Errors are surfaced with an appropriate status code and a human-readable message; no specific error body schema is mandated beyond being readable.
- Node.js with Express is the implementation technology named by the requester, but the specification is expressed in terms of the API's observable behavior. Runtime flags for optional persistence are documented in the implementation plan and quickstart.
- The browser page served by the backend and the deployed `ToDo2` frontend are auxiliary demos with their own localStorage and are not part of the API contract.
