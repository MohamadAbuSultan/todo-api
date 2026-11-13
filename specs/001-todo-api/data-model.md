# Data Model: Minimal To-Do API

## Entity: To-Do Item

### Fields

- **id**: `string` (UUID)
  - **Description**: Unique identifier assigned automatically at creation time
  - **Format**: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
  - **Validation**: Must be a valid UUID format
  - **Constraints**: Cannot be updated or deleted, immutable

- **title**: `string`
  - **Description**: Text describing the to-do item
  - **Format**: Plain text string
  - **Validation**: 
    - Must be present (non-null, non-empty)
    - After trimming whitespace, must not be empty
    - Can contain any valid text characters
  - **Constraints**: Maximum length not specified in requirements (no explicit cap)

### Entity Characteristics

- **Storage**: In-memory array (JavaScript array)
- **Lifetime**: Persists for the duration of the application runtime
- **Persistence**: No persistence across application restarts
- **Relationships**: No relationships between items (each item is independent)
- **State Management**: Items are stored as-is; no state transitions

### Validation Rules from Requirements

Based on FR-002 (title validation):
- Title must be provided in the request body
- Title must pass whitespace trimming check
- Empty titles are rejected with 400 error
- Non-text titles are rejected with 400 error

### Technical Notes

- UUID generation ensures uniqueness across all items
- In-memory storage provides O(1) access for all operations
- No database indexing needed for simple CRUD operations
- Memory usage grows linearly with number of items stored
- No persistence requires no database schema management

## Summary

The To-Do Item entity is a simple data structure with two fields: a unique identifier and a validated title. It supports basic CRUD operations through the API endpoints defined in the feature specification. All business logic and validation rules are enforced by the service layer, keeping the data model lightweight and focused on structure only.