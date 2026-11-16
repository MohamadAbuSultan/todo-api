'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateTitle } = require('../../src/utils/validation');

test('accepts text and trims surrounding whitespace', () => {
  assert.equal(validateTitle('  Buy groceries  '), 'Buy groceries');
  assert.equal(validateTitle('Walk the dog'), 'Walk the dog');
});

test('rejects a missing title', () => {
  assert.throws(() => validateTitle(undefined), {
    message: 'Title is required',
    statusCode: 400,
  });
  assert.throws(() => validateTitle(null), {
    message: 'Title is required',
    statusCode: 400,
  });
});

test('rejects a blank or whitespace-only title', () => {
  assert.throws(() => validateTitle(''), {
    message: 'Title cannot be empty',
    statusCode: 400,
  });
  assert.throws(() => validateTitle('   '), {
    message: 'Title cannot be empty',
    statusCode: 400,
  });
});

test('rejects non-text titles', () => {
  for (const value of [42, true, {}, [], () => {}]) {
    assert.throws(() => validateTitle(value), {
      message: 'Title must be a string',
      statusCode: 400,
    });
  }
});
