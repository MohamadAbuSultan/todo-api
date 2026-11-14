'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_STORAGE_KEY,
  LocalStorageStore,
  isQuotaExceededError,
} = require('../../src/storage/local-storage');

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
    warn(message, error) {
      warnings.push({ message, error });
    },
  };
}

test('save serializes values and load parses them back', () => {
  const storage = new FakeStorage();
  const store = new LocalStorageStore({ storage });

  const items = [{ id: 'todo-1', title: 'Write tests' }];
  assert.equal(store.save(items), true);
  assert.equal(storage.getItem(DEFAULT_STORAGE_KEY), JSON.stringify(items));
  assert.deepEqual(store.load(), items);
});

test('load returns an empty array when no value has been stored', () => {
  const store = new LocalStorageStore({ storage: new FakeStorage() });

  assert.deepEqual(store.load(), []);
});

test('load returns an empty array for invalid JSON and reports the problem', () => {
  const logger = createLogger();
  const storage = new FakeStorage({ [DEFAULT_STORAGE_KEY]: '{"title":' });
  const store = new LocalStorageStore({ storage, logger });

  assert.deepEqual(store.load(), []);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0].message, /not valid JSON/);
});

test('load returns an empty array when the stored value is not an array', () => {
  const logger = createLogger();
  const storage = new FakeStorage({
    [DEFAULT_STORAGE_KEY]: JSON.stringify({ id: 'todo-1', title: 'Not a list' }),
  });
  const store = new LocalStorageStore({ storage, logger });

  assert.deepEqual(store.load(), []);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0].message, /not an array/);
});

test('load handles a storage object whose read operation throws', () => {
  const logger = createLogger();
  const storage = {
    getItem() {
      throw new Error('Storage is blocked');
    },
    setItem() {},
  };
  const store = new LocalStorageStore({ storage, logger });

  assert.deepEqual(store.load(), []);
  assert.equal(logger.warnings.length, 1);
});

test('missing localStorage is handled without throwing', () => {
  const store = new LocalStorageStore({ storage: null });

  assert.equal(store.isAvailable(), false);
  assert.deepEqual(store.load(), []);
  assert.equal(store.save([]), false);
  assert.equal(store.clear(), false);
});

test('save returns false and keeps running when the quota is exceeded', () => {
  const logger = createLogger();
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      const error = new Error('Quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    },
  };
  const store = new LocalStorageStore({ storage, logger });

  assert.equal(store.save([{ id: 'todo-1', title: 'Too much' }]), false);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0].message, /quota exceeded/);
});

test('save returns false when the value cannot be serialized', () => {
  const logger = createLogger();
  const circular = {};
  circular.self = circular;
  const store = new LocalStorageStore({ storage: new FakeStorage(), logger });

  assert.equal(store.save(circular), false);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0].message, /serialize/);
});

test('clear removes the stored entry when possible', () => {
  const storage = new FakeStorage({ [DEFAULT_STORAGE_KEY]: '[]' });
  const store = new LocalStorageStore({ storage });

  assert.equal(store.clear(), true);
  assert.equal(storage.getItem(DEFAULT_STORAGE_KEY), null);
});

test('isQuotaExceededError recognizes common browser error names and codes', () => {
  assert.equal(isQuotaExceededError({ name: 'QuotaExceededError' }), true);
  assert.equal(isQuotaExceededError({ name: 'NS_ERROR_DOM_QUOTA_REACHED' }), true);
  assert.equal(isQuotaExceededError({ code: 22 }), true);
  assert.equal(isQuotaExceededError({ code: 1014 }), true);
  assert.equal(isQuotaExceededError(new Error('Other')), false);
  assert.equal(isQuotaExceededError(null), false);
});
