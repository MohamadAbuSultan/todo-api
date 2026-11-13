'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('../helpers/server');

async function postTodo(baseUrl, body) {
  return fetch(`${baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('creates an item and retrieves it immediately', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const createResponse = await postTodo(server.baseUrl, { title: 'Complete project' });
  assert.equal(createResponse.status, 201);

  const created = await createResponse.json();
  assert.equal(typeof created.id, 'string');
  assert.equal(created.title, 'Complete project');

  const listResponse = await fetch(`${server.baseUrl}/todos`);
  assert.equal(listResponse.status, 200);

  const todos = await listResponse.json();
  assert.deepEqual(todos, [created]);
});

test('returns an empty array when no items exist', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/todos`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});

test('rejects a missing body without storing an item', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/todos`, { method: 'POST' });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Title is required' });

  const listResponse = await fetch(`${server.baseUrl}/todos`);
  assert.deepEqual(await listResponse.json(), []);
});

test('rejects a missing title without storing an item', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await postTodo(server.baseUrl, {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Title is required' });
  assert.deepEqual(await (await fetch(`${server.baseUrl}/todos`)).json(), []);
});

test('rejects blank and non-text titles without storing items', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const blankResponse = await postTodo(server.baseUrl, { title: '   ' });
  assert.equal(blankResponse.status, 400);
  assert.deepEqual(await blankResponse.json(), { error: 'Title cannot be empty' });

  const numberResponse = await postTodo(server.baseUrl, { title: 123 });
  assert.equal(numberResponse.status, 400);
  assert.deepEqual(await numberResponse.json(), { error: 'Title must be a string' });

  const objectResponse = await postTodo(server.baseUrl, { title: { text: 'nope' } });
  assert.equal(objectResponse.status, 400);
  assert.deepEqual(await objectResponse.json(), { error: 'Title must be a string' });

  assert.deepEqual(await (await fetch(`${server.baseUrl}/todos`)).json(), []);
});

test('trims titles and stores duplicates as distinct items in creation order', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const first = await (await postTodo(server.baseUrl, { title: '  Same title  ' })).json();
  const second = await (await postTodo(server.baseUrl, { title: 'Same title' })).json();

  assert.equal(first.title, 'Same title');
  assert.notEqual(first.id, second.id);

  const todos = await (await fetch(`${server.baseUrl}/todos`)).json();
  assert.deepEqual(todos, [first, second]);
});

test('handles malformed JSON and remains available for later requests', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const malformedResponse = await fetch(`${server.baseUrl}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"title":',
  });
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), { error: 'Invalid JSON body' });

  const validResponse = await postTodo(server.baseUrl, { title: 'Still works' });
  assert.equal(validResponse.status, 201);

  const todos = await (await fetch(`${server.baseUrl}/todos`)).json();
  assert.equal(todos.length, 1);
  assert.equal(todos[0].title, 'Still works');
});

test('returns a structured 404 for unknown routes', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(`${server.baseUrl}/unknown`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Not found' });
});
