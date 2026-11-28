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

test('create stores the item through the repository', async () => {
  const repository = new InMemoryTodoRepository();
  const service = new TodoService({ repository, idGenerator: () => 'todo-1' });

  const todo = await service.create('Write tests');

  assert.deepEqual(todo, { id: 'todo-1', title: 'Write tests' });
  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'Write tests' }]);
});

test('update writes the validated title through the repository', async () => {
  const repository = new InMemoryTodoRepository();
  const service = new TodoService({ repository, idGenerator: () => 'todo-1' });

  await service.create('Old title');
  const updated = await service.update('todo-1', { title: '  New title  ' });

  assert.deepEqual(updated, { id: 'todo-1', title: 'New title' });
  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'New title' }]);
});

test('update ignores fields that are not allowed to change', async () => {
  const repository = new InMemoryTodoRepository();
  const service = new TodoService({ repository, idGenerator: () => 'todo-1' });

  await service.create('Original');
  const updated = await service.update('todo-1', {
    title: 'Changed',
    id: 'other',
    extra: 'ignored',
  });

  assert.deepEqual(updated, { id: 'todo-1', title: 'Changed' });
  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'Changed' }]);
});

test('update rejects a missing title without changing the stored item', async () => {
  const repository = new InMemoryTodoRepository();
  const service = new TodoService({ repository, idGenerator: () => 'todo-1' });

  await service.create('Original');

  await assert.rejects(() => service.update('todo-1', {}), {
    message: 'Title is required',
    statusCode: 400,
  });
  await assert.rejects(() => service.update('todo-1', { title: '   ' }), {
    message: 'Title cannot be empty',
    statusCode: 400,
  });
  assert.deepEqual(await repository.findAll(), [{ id: 'todo-1', title: 'Original' }]);
});

test('update and remove reject unknown ids', async () => {
  const service = createService();

  await assert.rejects(() => service.update('missing', { title: 'Title' }), {
    message: 'Todo not found',
    statusCode: 404,
  });
  await assert.rejects(() => service.remove('missing'), {
    message: 'Todo not found',
    statusCode: 404,
  });
});

test('remove deletes the item through the repository', async () => {
  const repository = new InMemoryTodoRepository();
  const service = new TodoService({ repository, idGenerator: () => 'todo-1' });

  await service.create('Remove me');
  const removed = await service.remove('todo-1');

  assert.deepEqual(removed, { id: 'todo-1', title: 'Remove me' });
  assert.deepEqual(await repository.findAll(), []);
});

test('repository failures propagate to the caller', async () => {
  const failure = new Error('Storage unavailable');
  const repository = {
    create: async () => {
      throw failure;
    },
    findAll: async () => {
      throw failure;
    },
    update: async () => {
      throw failure;
    },
    remove: async () => {
      throw failure;
    },
  };
  const service = new TodoService({ repository });

  await assert.rejects(() => service.getAll(), { message: 'Storage unavailable' });
  await assert.rejects(() => service.create('Anything'), { message: 'Storage unavailable' });
});
