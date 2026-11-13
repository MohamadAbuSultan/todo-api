'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TodoService } = require('../../src/services/todo.service');

test('create stores an item and returns its id and trimmed title', () => {
  const service = new TodoService({ idGenerator: () => 'todo-1' });

  const todo = service.create('  Write tests  ');

  assert.deepEqual(todo, { id: 'todo-1', title: 'Write tests' });
  assert.deepEqual(service.getAll(), [{ id: 'todo-1', title: 'Write tests' }]);
});

test('getAll returns items in creation order', () => {
  let id = 0;
  const service = new TodoService({ idGenerator: () => `todo-${++id}` });

  service.create('First');
  service.create('Second');
  service.create('Third');

  assert.deepEqual(service.getAll(), [
    { id: 'todo-1', title: 'First' },
    { id: 'todo-2', title: 'Second' },
    { id: 'todo-3', title: 'Third' },
  ]);
});

test('getAll returns an empty array when nothing has been created', () => {
  const service = new TodoService();

  assert.deepEqual(service.getAll(), []);
});

test('create rejects invalid titles without storing an item', () => {
  const service = new TodoService();

  assert.throws(() => service.create('   '), { statusCode: 400 });
  assert.throws(() => service.create(123), { statusCode: 400 });
  assert.deepEqual(service.getAll(), []);
});

test('clear removes all stored items', () => {
  const service = new TodoService();
  service.create('Something');

  service.clear();

  assert.deepEqual(service.getAll(), []);
});
