'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('../helpers/server');

async function createTodo(baseUrl, title) {
  const response = await fetch(`${baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  return { response, todo: await response.json() };
}

async function patchTodo(baseUrl, id, body) {
  return fetch(`${baseUrl}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('updates an item title and returns the updated item', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const { todo } = await createTodo(server.baseUrl, 'Old title');
  const response = await patchTodo(server.baseUrl, todo.id, { title: '  New title  ' });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: todo.id, title: 'New title' });

  const todos = await (await fetch(`${server.baseUrl}/todos`)).json();
  assert.deepEqual(todos, [{ id: todo.id, title: 'New title' }]);
});

test('rejects an invalid update without changing the item', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const { todo } = await createTodo(server.baseUrl, 'Original');

  const blankResponse = await patchTodo(server.baseUrl, todo.id, { title: '   ' });
  assert.equal(blankResponse.status, 400);
  assert.deepEqual(await blankResponse.json(), { error: 'Title cannot be empty' });

  const missingResponse = await patchTodo(server.baseUrl, todo.id, {});
  assert.equal(missingResponse.status, 400);
  assert.deepEqual(await missingResponse.json(), { error: 'Title is required' });

  const todos = await (await fetch(`${server.baseUrl}/todos`)).json();
  assert.deepEqual(todos, [{ id: todo.id, title: 'Original' }]);
});

test('returns 404 when updating or deleting an unknown item', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const patchResponse = await patchTodo(server.baseUrl, 'missing', { title: 'Nope' });
  assert.equal(patchResponse.status, 404);
  assert.deepEqual(await patchResponse.json(), { error: 'Todo not found' });

  const deleteResponse = await fetch(`${server.baseUrl}/todos/missing`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 404);
  assert.deepEqual(await deleteResponse.json(), { error: 'Todo not found' });
});

test('deletes an item and returns it', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const { todo } = await createTodo(server.baseUrl, 'Remove me');

  const response = await fetch(`${server.baseUrl}/todos/${todo.id}`, { method: 'DELETE' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), todo);

  const todos = await (await fetch(`${server.baseUrl}/todos`)).json();
  assert.deepEqual(todos, []);
});
