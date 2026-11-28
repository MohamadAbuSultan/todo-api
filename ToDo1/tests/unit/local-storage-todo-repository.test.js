'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  LocalStorageTodoRepository,
} = require('../../src/repositories/local-storage-todo-repository');
const { LocalStorageStore } = require('../../src/storage/local-storage');

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

function createLogger() {
  const warnings = [];

  return {
    warnings,
    warn(message) {
      warnings.push(message);
    },
  };
}

function readItems(storage, key = 'todos') {
  return JSON.parse(storage.getItem(key));
}

function createRepository({ storage, logger } = {}) {
  return new LocalStorageTodoRepository({
    store: new LocalStorageStore({ storage, logger }),
    logger,
  });
}

test('loads existing items from storage when the repository is constructed', async () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([
      { id: 'todo-1', title: 'First' },
      { id: 'todo-2', title: 'Second' },
    ]),
  });

  const repository = createRepository({ storage });

  assert.deepEqual(await repository.findAll(), [
    { id: 'todo-1', title: 'First' },
    { id: 'todo-2', title: 'Second' },
  ]);
});

test('invalid stored items are skipped when the repository is constructed', async () => {
  const logger = createLogger();
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

  const repository = createRepository({ storage, logger });

  assert.deepEqual(await repository.findAll(), [
    { id: 'todo-1', title: 'Valid' },
    { id: 'todo-3', title: 'Also valid' },
  ]);
  assert.equal(logger.warnings.length, 4);
  assert.match(logger.warnings[0], /Skipping invalid stored todo/);
});

test('create persists the updated collection', async () => {
  const storage = new FakeStorage();
  const repository = createRepository({ storage });

  await repository.create({ id: 'todo-1', title: 'Write tests' });

  assert.deepEqual(readItems(storage), [{ id: 'todo-1', title: 'Write tests' }]);
});

test('update persists the changed item', async () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([{ id: 'todo-1', title: 'Old title' }]),
  });
  const repository = createRepository({ storage });

  const updated = await repository.update('todo-1', { title: 'New title' });

  assert.deepEqual(updated, { id: 'todo-1', title: 'New title' });
  assert.deepEqual(readItems(storage), [{ id: 'todo-1', title: 'New title' }]);
});

test('remove persists the remaining collection', async () => {
  const storage = new FakeStorage({
    todos: JSON.stringify([
      { id: 'todo-1', title: 'First' },
      { id: 'todo-2', title: 'Second' },
    ]),
  });
  const repository = createRepository({ storage });

  const removed = await repository.remove('todo-1');

  assert.deepEqual(removed, { id: 'todo-1', title: 'First' });
  assert.deepEqual(readItems(storage), [{ id: 'todo-2', title: 'Second' }]);
});

test('update and remove return null for unknown ids', async () => {
  const repository = createRepository({ storage: new FakeStorage() });

  assert.equal(await repository.update('missing', { title: 'Title' }), null);
  assert.equal(await repository.remove('missing'), null);
});

test('a storage write failure does not prevent the in-memory change', async () => {
  const logger = createLogger();
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('Storage unavailable');
    },
  };
  const repository = createRepository({ storage, logger });

  const created = await repository.create({ id: 'todo-1', title: 'Still works' });

  assert.deepEqual(created, { id: 'todo-1', title: 'Still works' });
  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'Still works' }]);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0], /changes are kept in memory only/);
});

test('a custom storage key is used for loading and saving', async () => {
  const storage = new FakeStorage({
    'custom-key': JSON.stringify([{ id: 'todo-1', title: 'Custom' }]),
  });
  const repository = new LocalStorageTodoRepository({
    store: new LocalStorageStore({ key: 'custom-key', storage }),
  });

  await repository.create({ id: 'todo-2', title: 'Second' });

  assert.deepEqual(readItems(storage, 'custom-key'), [
    { id: 'todo-1', title: 'Custom' },
    { id: 'todo-2', title: 'Second' },
  ]);
});

test('the repository works without any available storage', async () => {
  const repository = createRepository({ storage: null });

  assert.deepEqual(await repository.findAll(), []);

  const created = await repository.create({ id: 'todo-1', title: 'In memory only' });

  assert.deepEqual(created, { id: 'todo-1', title: 'In memory only' });
  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'In memory only' }]);
});

test('the repository never exposes its internal records', async () => {
  const repository = createRepository({ storage: new FakeStorage() });

  const created = await repository.create({ id: 'todo-1', title: 'Copy' });
  created.title = 'Changed outside';

  const [found] = await repository.findAll();
  found.title = 'Also changed outside';

  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'Copy' }]);
});
