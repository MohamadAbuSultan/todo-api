# Quickstart: Minimal To-Do API

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Terminal/command line access

## Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the server**:
   ```bash
   npm start
   # or
   node src/app.js
   ```

## API Endpoints

Open `http://localhost:3000/` in a browser to use the to-do list.
The browser page saves its items in that browser's localStorage; this data is
separate from the API data returned by `GET /todos`.
The API provides the following endpoints for managing to-do items:

### POST /todos
Create a new to-do item

**Request Body**:
```json
{
  "title": "Buy groceries"
}
```

**Success Response (201)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries"
}
```

**Error Responses**:
- **400 Bad Request** - Missing title:
  ```json
  {
    "error": "Title is required"
  }
  ```

- **400 Bad Request** - Empty title (after whitespace trimming):
  ```json
  {
    "error": "Title cannot be empty"
  }
  ```

### GET /todos
Retrieve all to-do items

**Success Response (200)**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Walk the dog"
  }
]
```

**Empty Response (200)**:
```json
[]
```

## Validation Scenarios

### 1. Create To-Do with Valid Title

**Test**: Create a to-do item with a valid title

**Steps**:
1. Send POST request with body: `{"title": "Complete project"}`
2. Verify response status: 201
3. Verify response body contains id and title
4. Use the returned id to retrieve the item via GET

**Expected Outcome**: The item is created, stored, and can be retrieved immediately

### 2. Create To-Do with Missing Title

**Test**: Attempt to create a to-do item without a title

**Steps**:
1. Send POST request with body: `{}` or no body
2. Verify response status: 400
3. Verify error message indicates title is required
4. Verify no item is stored (GET /todos should return empty or unchanged)

**Expected Outcome**: Request is rejected with validation error, no item is stored

### 3. Create To-Do with Empty Title

**Test**: Attempt to create a to-do item with an empty title (whitespace only)

**Steps**:
1. Send POST request with body: `{"title": "   "}`
2. Verify response status: 400
3. Verify error message indicates title cannot be empty
4. Verify no item is stored

**Expected Outcome**: Whitespace-only title is rejected, no item is stored

### 4. Retrieve To-Do List

**Test**: Retrieve all stored to-do items

**Steps**:
1. Ensure at least one to-do item exists (create one first)
2. Send GET request to /todos
3. Verify response status: 200
4. Verify response is a JSON array
5. Verify each item contains id and title
6. Verify all items created in the session are present

**Expected Outcome**: All items are returned in creation order

### 5. Error Handling

**Test**: Verify malformed requests are handled gracefully

**Steps**:
1. Send POST request with invalid JSON body
2. Verify response status: 400
3. Verify service remains available for subsequent valid requests
4. Send valid request to confirm service is still functional

**Expected Outcome**: Service handles errors gracefully and continues operating

## Validation Commands

### Run Tests
```bash
npm test
# or
jest
```

### Test Individual Endpoints
```bash
# Create a to-do
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task"}'

# List all to-dos
curl http://localhost:3000/todos
```

## API Contract Reference

See `contracts/todo-api.json` for detailed API specification and example requests/responses.

## Notes

- All items are stored in memory; restart clears all data
- No authentication or authorization required for this minimal API
- Error responses include human-readable messages
- API follows RESTful conventions with appropriate HTTP status codes
- Validation is strict for required fields and business rules
- Each item receives a unique identifier automatically