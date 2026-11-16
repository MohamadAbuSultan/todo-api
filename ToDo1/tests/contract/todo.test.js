'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const contract = require('../../specs/001-todo-api/contracts/todo-api.json');
const { startTestServer } = require('../helpers/server');

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('the OpenAPI contract documents the GET and POST /todos operations', () => {
  assert.ok(contract.paths['/todos'].get);
  assert.ok(contract.paths['/todos'].post);
  assert.deepEqual(contract.components.schemas.TodoItem.required, ['id', 'title']);
});

test('POST /todos returns the documented 201 TodoItem shape', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Buy groceries' }),
  });

  assert.equal(response.status, 201);

  const todo = await response.json();
  assert.deepEqual(Object.keys(todo).sort(), ['id', 'title']);
  assert.match(todo.id, UUID_V4);
  assert.equal(todo.title, 'Buy groceries');
});

test('GET /todos returns the documented 200 TodoItem array shape', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await fetch(`${server.baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Walk the dog' }),
  });

  const response = await fetch(`${server.baseUrl}/todos`);
  assert.equal(response.status, 200);

  const todos = await response.json();
  assert.ok(Array.isArray(todos));
  assert.equal(todos.length, 1);
  assert.deepEqual(Object.keys(todos[0]).sort(), ['id', 'title']);
  assert.match(todos[0].id, UUID_V4);
  assert.equal(todos[0].title, 'Walk the dog');
});

test('POST /todos returns the documented 400 Error shape', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);

  const error = await response.json();
  assert.deepEqual(Object.keys(error), ['error']);
  assert.equal(typeof error.error, 'string');
});
