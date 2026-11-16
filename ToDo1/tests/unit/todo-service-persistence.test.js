'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TodoService } = require('../../src/services/todo.service');

class FakeStorage {
  constructor(initial = {}) {
    this.data = new Map(Object.entries(initial));
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

const silentLogger = {
  info() {},
  warn() {},
  error() {},
};

function readItems(storage, key = 'todos') {
  return JSON.parse(storage.getItem(key));
}

test('loads existing items from storage when the service is constructed', () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([
      { id: 'todo-1', title: 'First' },
      { id: 'todo-2', title: 'Second' },
    ]),
  });

  const service = new TodoService({ storage, logger: silentLogger });

  assert.deepEqual(service.getAll(), [
    { id: 'todo-1', title: 'First' },
    { id: 'todo-2', title: 'Second' },
  ]);
});

test('list items are skipped when stored data is malformed', () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([
      { id: 'todo-1', title: 'Valid' },
      null,
      { title: 'Missing id' },
      { id: '', title: 'Empty id' },
      { id: 'todo-2', title: '   ' },
      { id: 'todo-3', title: 'Also valid' },
    ]),
  });

  const service = new TodoService({ storage, logger: silentLogger });

  assert.deepEqual(service.getAll(), [
    { id: 'todo-1', title: 'Valid' },
    { id: 'todo-3', title: 'Also valid' },
  ]);
});

test('create persists the updated collection', () => {
  const storage = new FakeStorage();
  const service = new TodoService({
    storage,
    idGenerator: () => 'todo-1',
    logger: silentLogger,
  });

  service.create('Write tests');

  assert.deepEqual(readItems(storage), [{ id: 'todo-1', title: 'Write tests' }]);
});

test('update persists the changed item', () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([{ id: 'todo-1', title: 'Old title' }]),
  });
  const service = new TodoService({ storage, logger: silentLogger });

  const updated = service.update('todo-1', '  New title  ');

  assert.deepEqual(updated, { id: 'todo-1', title: 'New title' });
  assert.deepEqual(readItems(storage), [{ id: 'todo-1', title: 'New title' }]);
});

test('remove persists the remaining collection', () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([
      { id: 'todo-1', title: 'First' },
      { id: 'todo-2', title: 'Second' },
    ]),
  });
  const service = new TodoService({ storage, logger: silentLogger });

  const removed = service.remove('todo-1');

  assert.deepEqual(removed, { id: 'todo-1', title: 'First' });
  assert.deepEqual(readItems(storage), [{ id: 'todo-2', title: 'Second' }]);
});

test('update and remove reject unknown ids', () => {
  const service = new TodoService({ storage: new FakeStorage(), logger: silentLogger });

  assert.throws(() => service.update('missing', 'Title'), {
    message: 'Todo not found',
    statusCode: 404,
  });
  assert.throws(() => service.remove('missing'), {
    message: 'Todo not found',
    statusCode: 404,
  });
});

test('clear persists an empty collection', () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([{ id: 'todo-1', title: 'First' }]),
  });
  const service = new TodoService({ storage, logger: silentLogger });

  service.clear();

  assert.deepEqual(readItems(storage), []);
});

test('a storage write failure does not prevent in-memory changes', () => {
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('Storage unavailable');
    },
  };
  const service = new TodoService({
    storage,
    idGenerator: () => 'todo-1',
    logger: silentLogger,
  });

  assert.deepEqual(service.create('Still works'), { id: 'todo-1', title: 'Still works' });
  assert.deepEqual(service.getAll(), [{ id: 'todo-1', title: 'Still works' }]);
});

test('a custom storage key is used for loading and saving', () => {
  const storage = new FakeStorage({
    'custom-key': JSON.stringify([{ id: 'todo-1', title: 'Custom' }]),
  });
  const service = new TodoService({
    storage,
    storageKey: 'custom-key',
    idGenerator: () => 'todo-2',
    logger: silentLogger,
  });

  service.create('Second');

  assert.deepEqual(readItems(storage, 'custom-key'), [
    { id: 'todo-1', title: 'Custom' },
    { id: 'todo-2', title: 'Second' },
  ]);
});
