# Tasks: Minimal To-Do API

**Input**: Design documents from `/specs/001-todo-api/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Infrastructure Setup (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] **T001**: Create project structure per implementation plan
- [x] **T002**: Initialize Node.js project with Express dependencies
- [x] **T003**: [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] **T004**: Setup Express application entry point
- [x] **T005**: [P] Configure Express middleware and error handling
- [x] **T006**: Setup in-memory storage infrastructure
- [x] **T007**: Implement validation utilities
- [x] **T008**: [P] Configure testing framework and test structure
- [x] **T009**: Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create To-Do Item (Priority: P1) 🎯 MVP

**Goal**: Client can submit a title to create a new to-do item with validation, unique ID assignment, and structured response

**Independent Test**: Create one to-do item with valid title, verify it returns with ID and title, then retrieve it immediately

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

- [x] **T010**: [P] [US1] Contract test for POST /todos endpoint in tests/contract/todo.test.js
- [x] **T011**: [P] [US1] Integration test for create user journey in tests/integration/todo.test.js
- [x] **T012**: [P] [US1] Unit test for validation logic in tests/unit/validation.test.js

### Implementation for User Story 1

- [x] **T013**: [P] [US1] Create TodoItem model in src/models/todo-item.js
- [x] **T014**: [P] [US1] Implement TodoService with create() method in src/services/todo.service.js
- [x] **T015**: [US1] Implement POST /todos route in src/api/todo.routes.js
- [x] **T016**: [US1] Add Express middleware for request parsing and validation
- [x] **T017**: [US1] Implement validation utilities for title requirements
- [x] **T018**: [P] [US1] Add error handling middleware
- [x] **T019**: [US1] Add logging for create operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - List To-Do Items (Priority: P2)

**Goal**: Client can retrieve all stored to-do items in creation order

**Independent Test**: Create multiple items, then list and verify all items are returned with correct data

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [x] **T020**: [P] [US2] Contract test for GET /todos endpoint in tests/contract/todo.test.js
- [x] **T021**: [P] [US2] Integration test for list user journey in tests/integration/todo.test.js
- [x] **T022**: [P] [US2] Unit test for TodoService list operation in tests/unit/todo-service.test.js

### Implementation for User Story 2

- [x] **T023**: [US2] Implement GET /todos route in src/api/todo.routes.js
- [x] **T024**: [US2] Extend TodoService with getAll() method in src/services/todo.service.js
- [x] **T025**: [US2] Integrate TodoService with GET route
- [x] **T026**: [US2] Add logging for list operations

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

---

## Phase 5: Quality & Production Readiness

**Purpose**: Improvements that affect multiple user stories

- [ ] **TXXX**: Documentation updates in docs/
- [x] **TXXX**: Code cleanup and refactoring
- [ ] **TXXX**: Performance optimization across all stories
- [x] **TXXX**: [P] Additional unit tests (if requested) in tests/unit/
- [x] **TXXX**: Security hardening
- [x] **TXXX**: Run quickstart.md validation
- [ ] **TXXX**: Add security headers and rate limiting
- [x] **TXXX**: Add input sanitization

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Quality (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Quick Start Implementation Guide

### Begin Implementation

**Phase 1: Infrastructure Setup**
```bash
# Initialize the project
cd /mnt/Back-End/NodeJs/ToDo
npm install
```

**Phase 2: Foundational**
```bash
# Create the basic structure
mkdir -p src/{api,models,services,utils}
mkdir -p tests/{contract,integration,unit}
mkdir -p logs
```

**Phase 3: User Story 1 (MVP)**
```bash
# Implement To-Do creation functionality
# 1. Create models/todo-item.js
# 2. Create services/todo.service.js
# 3. Create api/todo.routes.js
# 4. Create app.js (main entry point)
```

**Phase 4: User Story 2**
```bash
# Implement To-Do listing functionality
# 1. Extend services/todo.service.js with getAll()
# 2. Update api/todo.routes.js with GET /todos
```

**Run Tests**
```bash
# Run all tests
npm test

# Run specific test files
npm test tests/unit/todo-service.test.js
```

**Start the Application**
```bash
# Start the server
npm start

# Test the API
curl http://localhost:3000/todos
```

---

## Code Structure

### Backend

**Models** (Data Layer):
- `src/models/todo-item.js`: To-Do item data structure and validation
- Defines the shape of to-do items with id and title

**Services** (Business Logic Layer):
- `src/services/todo.service.js`: Business logic for to-do operations
- Contains in-memory storage, validation, and business rules

**API** (Presentation Layer):
- `src/api/todo.routes.js`: Express routes for HTTP endpoints
- Defines POST /todos and GET /todos endpoints

**Application** (Entry Point):
- `src/app.js`: Main Express application
- Configures middleware, routes, and starts the server

### Tests

**Contract Tests** (API Contract):
- `tests/contract/todo.test.js`: Validates OpenAPI contract

**Integration Tests** (End-to-End):
- `tests/integration/todo.test.js`: Tests API endpoints

**Unit Tests** (Component Testing):
- `tests/unit/todo-service.test.js`: Tests business logic
- `tests/unit/validation.test.js`: Tests validation utilities

### Logs

- `logs/`: Application logs will be created during runtime

---

## Success Criteria Verification

The implementation must meet all success criteria from the spec:

- **SC-001**: Valid create request succeeds on first attempt
- **SC-002**: 100% of invalid titles are rejected
- **SC-003**: List returns all items in order they were created
- **SC-004**: All error cases result in client-error responses
- **SC-005**: Can create/retrieve using only documented endpoints

---

## Development Workflow

1. **Implement**: Complete each task in order
2. **Test**: Run tests after each story is complete
3. **Validate**: Run quickstart.md scenarios
4. **Deploy**: Deploy after each story is ready
5. **Review**: Review with stakeholders after MVP

---

## Quality Gates

- **Before Implementation**: All tests pass
- **After Story 1**: API can create and retrieve to-do items
- **After Story 2**: API can list all to-do items
- **After Quality**: All tests pass, documentation updated, production ready

---

## Performance Targets

- **Response Time**: <200ms for create operations
- **Response Time**: <100ms for list operations  
- **Memory Usage**: <100MB for typical usage
- **Concurrency**: Handle 1000 concurrent users

---

## Security Checklist

- [x] Input validation for all endpoints
- [x] Error handling without information leakage
- [x] Security headers
- [x] Input sanitization
- [ ] CORS configuration
- [ ] Rate limiting (future)

---

## Monitoring & Observability

- **Logging**: All business operations logged
- **Error Tracking**: Detailed error logs
- **Performance Monitoring**: Response times tracked
- **Health Checks**: Liveness and readiness probes

---

## Rollback Strategy

If issues are found during testing:
1. Stop the application
2. Revert changes
3. Fix issues
4. Restart application
5. Re-run tests

---

## Version Control

Use semantic versioning: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

---

## Documentation

- **API Documentation**: OpenAPI contract in contracts/todo-api.json
- **Quickstart Guide**: Complete validation scenarios
- **Code Comments**: JSDoc for all public APIs
- **README**: Project setup and usage instructions

---

## Rollup Commands

```bash
# Build the application
npm run build

# Run all tests
npm test

# Start the application
npm start

# Development with auto-restart
npm run dev
```

---

## Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/todo-service.test.js

# Run integration tests
npm test -- tests/integration/todo.test.js

# Run contract tests
npm test -- tests/contract/todo.test.js
```

---

## Troubleshooting

**Common Issues**:

1. **Port already in use**: Change PORT in app.js
2. **Missing dependencies**: Run `npm install`
3. **Test failures**: Check console output for error details
4. **Validation errors**: Check request format

**Get Help**:
- Check console logs for error messages
- Review test output for failing tests
- Check validation rules in validation utilities
- Review OpenAPI contract for endpoint details

---

## Deployment Instructions

### Production

1. Build the application
```bash
npm run build
```

2. Configure environment variables
```bash
PORT=3000
NODE_ENV=production
```

3. Deploy to web server
4. Set up monitoring
5. Configure backup

### Development

1. Install dependencies
```bash
npm install
```

2. Start the server
```bash
npm start
```

3. Test the API
```bash
curl http://localhost:3000/todos
```

---

## Supported Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: In-memory array
- **ID Generation**: UUID v4
- **Validation**: Custom validation logic
- **Testing**: Node.js built-in test framework
- **Linting**: ESLint
- **Formatting**: Prettier

---

## Future Enhancements

1. **Persistence**: Save data to disk (JSON, SQLite)
2. **Authentication**: Add user authentication
3. **Authorization**: Add permission controls
4. **Rate Limiting**: Add API rate limiting
5. **Pagination**: Add pagination for large datasets
6. **Filtering**: Add filtering and search capabilities
7. **Sorting**: Add sorting options
8. **Update/Delete**: Add update and delete operations
9. **Tags**: Add tag support
10. **Categories**: Add category support

---

## References

- **Feature Spec**: specs/001-todo-api/spec.md
- **Implementation Plan**: specs/001-todo-api/plan.md
- **Data Model**: specs/001-todo-api/data-model.md
- **API Contract**: specs/001-todo-api/contracts/todo-api.json
- **Quickstart Guide**: specs/001-todo-api/quickstart.md
- **Checklist**: specs/001-todo-api/checklists/requirements.md

---

## Credits

This implementation was built following the Speckit specification framework and industry best practices for Node.js web development.