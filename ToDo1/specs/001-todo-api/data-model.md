# Data Model: Minimal To-Do API

## Entity: To-Do Item

### Fields

- **id**: `string`
  - **Description**: Opaque identifier assigned at creation time; immutable for the lifetime of the item.
  - **Generation**: UUID v4 by default (example: `550e8400-e29b-41d4-a716-446655440000`). A custom generator may be supplied programmatically.
  - **Validation**: Not validated as a UUID on input. Path identifiers are matched as arbitrary strings; a stored item must have a non-empty string id, and unknown ids produce a 404 response.
  - **Constraints**: Cannot be changed by the update operation; uniqueness relies on the identifier generator, which the service does not re-check.

- **title**: `string`
  - **Description**: Text describing the to-do item.
  - **Format**: Plain text string.
  - **Validation**:
    - Must be present, non-null, and text (a non-text value is rejected with 400).
    - Surrounding whitespace is trimmed; a result that is empty is rejected with 400.
    - Can contain any valid text characters.
  - **Constraints**: Maximum length is not specified; no explicit cap is imposed.
  - **Note**: The update operation requires the title. It is a full title replacement, not a partial update.

### Entity Characteristics

- **Storage**: JavaScript array held in `TodoService` (`ToDo1/src/services/todo.service.js`) for the lifetime of the process.
- **Optional persistence**: `LocalStorageStore` (`ToDo1/src/storage/local-storage.js`) reads and writes a JSON array under the `todos` key through a runtime-provided Web Storage object. It is used only when that runtime capability is available; the application itself provides no database or file-storage system.
- **Load behavior**: Invalid stored entries (non-objects, missing or empty ids, invalid titles) are skipped with a warning. Unavailable storage, invalid JSON, or JSON that is not an array yields an empty list with a warning.
- **Write behavior**: Serialization or write failures return `false` and emit a warning; the in-memory collection is still mutated and the API request still succeeds.
- **Lifetime**: Lost on restart by default. Restored on restart only when optional runtime Web Storage persistence is enabled and configured.
- **Relationships**: No relationships between items; each item is independent.
- **State management**: Items are stored as-is; the API entity has no completion flag. Any `completed` field belongs to the auxiliary browser demo's own localStorage data, not to this entity.

### Validation Rules from Requirements

Based on FR-002, FR-008 and FR-011:

- Title must be provided in the request body for create and update.
- Request bodies must be JSON objects; malformed JSON and non-object bodies are rejected with 400. Arrays reach the object check (`Request body must be a JSON object`); JSON primitives are rejected by the parser (`Invalid JSON body`).
- Title must pass whitespace trimming; empty results are rejected with 400.
- Non-text titles are rejected with 400.
- Update and delete with an unknown id are rejected with 404.

### Technical Notes

- UUID v4 generation makes collisions unlikely; the service does not scan for duplicate ids.
- Identifier lookup is a linear `findIndex` (O(n)); no indexing is used.
- Memory usage grows linearly with the number of stored items.
- Neither the default in-memory storage nor the optional Web Storage adapter requires schema or
  migration management.

## Summary

The To-Do Item entity is a simple data structure with two fields: an opaque identifier (UUID v4 by
default) and a validated title. It supports create, list, update, and delete through the API endpoints
defined in the feature specification. Validation and persistence behavior live in the service and
storage layers (`ToDo1/src/services/todo.service.js`, `ToDo1/src/utils/validation.js`,
`ToDo1/src/storage/local-storage.js`), keeping the data model lightweight and focused on structure.
