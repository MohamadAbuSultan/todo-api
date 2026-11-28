'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { InMemoryTodoRepository } = require('../../src/repositories/in-memory-todo-repository');
const { TodoService } = require('../../src/services/todo.service');

/**
 * Build a service backed by a fresh in-memory repository.
 * @param {object} [options]
 * @returns {TodoService}
 */
function createService(options = {}) {
  return new TodoService({ repository: new InMemoryTodoRepository(), ...options });
}

test('create stores an item and returns its id and trimmed title', async () => {
  const service = createService({ idGenerator: () => 'todo-1' });

  const todo = await service.create('  Write tests  ');

  assert.deepEqual(todo, { id: 'todo-1', title: 'Write tests' });
  assert.deepEqual(await service.getAll(), [{ id: 'todo-1', title: 'Write tests' }]);
});

test('getAll returns items in creation order', async () => {
  let id = 0;
  const service = createService({ idGenerator: () => `todo-${++id}` });

  await service.create('First');
  await service.create('Second');
  await service.create('Third');

  assert.deepEqual(await service.getAll(), [
    { id: 'todo-1', title: 'First' },
    { id: 'todo-2', title: 'Second' },
    { id: 'todo-3', title: 'Third' },
  ]);
});

test('getAll returns an empty array when nothing has been created', async () => {
  const service = createService();

  assert.deepEqual(await service.getAll(), []);
});

test('create rejects invalid titles without storing an item', async () => {
  const service = createService();

  await assert.rejects(() => service.create('   '), { statusCode: 400 });
  await assert.rejects(() => service.create(123), { statusCode: 400 });
  assert.deepEqual(await service.getAll(), []);
});

test('update replaces the title and keeps the identifier', async () => {
  const service = createService({ idGenerator: () => 'todo-1' });

  await service.create('Old title');
  const updated = await service.update('todo-1', { title: '  New title  ' });

  assert.deepEqual(updated, { id: 'todo-1', title: 'New title' });
  assert.deepEqual(await service.getAll(), [{ id: 'todo-1', title: 'New title' }]);
});

test('remove deletes the item and returns it', async () => {
  const service = createService({ idGenerator: () => 'todo-1' });

  await service.create('Remove me');
  const removed = await service.remove('todo-1');

  assert.deepEqual(removed, { id: 'todo-1', title: 'Remove me' });
  assert.deepEqual(await service.getAll(), []);
});

test('the service reads the repository instead of keeping its own copy', async () => {
  const repository = new InMemoryTodoRepository();
  const service = new TodoService({ repository, idGenerator: () => 'todo-1' });

  await service.create('Something');
  await repository.remove('todo-1');

  assert.deepEqual(await service.getAll(), []);
});

test('the service requires a repository', () => {
  assert.throws(() => new TodoService(), /requires a repository/);
});
