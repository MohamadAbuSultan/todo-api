'use strict';

const { v4: uuidv4 } = require('uuid');
const { TodoItem } = require('../models/todo-item');
const { LocalStorageStore, isStorageLike } = require('../storage/local-storage');
const { validationError } = require('../utils/validation');

/**
 * Build the persistence adapter used by the service.
 * Existing storage-like objects (with getItem/setItem) are wrapped so callers
 * can provide the browser localStorage, a test double, or a custom store.
 * @param {{
 *   storage?: object | null,
 *   storageKey?: string,
 *   logger?: Console
 * }} options
 * @returns {object | null}
 */
function createStorageAdapter({ storage, storageKey, logger }) {
  if (storage && typeof storage.load === 'function' && typeof storage.save === 'function') {
    return storage;
  }

  if (storage === undefined || storage === null || isStorageLike(storage)) {
    return new LocalStorageStore({ key: storageKey, storage, logger });
  }

  return storage;
}

/**
 * Business logic and persistent storage for to-do items.
 */
class TodoService {
  /**
   * @param {{
   *   idGenerator?: () => string,
   *   storage?: object | Storage | null,
   *   storageKey?: string,
   *   logger?: Console
   * }} [options]
   */
  constructor({ idGenerator = uuidv4, storage, storageKey, logger = console } = {}) {
    this.idGenerator = idGenerator;
    this.logger = logger;
    this.storage = createStorageAdapter({ storage, storageKey, logger });
    /** @type {TodoItem[]} */
    this.todos = this.load();
  }

  /**
   * Load and validate previously persisted items.
   * Invalid entries are skipped rather than preventing startup.
   * @returns {TodoItem[]}
   */
  load() {
    if (!this.storage || typeof this.storage.load !== 'function') {
      return [];
    }

    const storedItems = this.storage.load();
    const todos = [];

    for (const storedItem of storedItems) {
      try {
        if (!storedItem || typeof storedItem !== 'object') {
          throw new Error('Stored item must be an object');
        }

        if (typeof storedItem.id !== 'string' || storedItem.id === '') {
          throw new Error('Stored item id must be a non-empty string');
        }

        todos.push(new TodoItem(storedItem.id, storedItem.title));
      } catch (error) {
        if (this.logger && typeof this.logger.warn === 'function') {
          this.logger.warn(`Skipping invalid stored todo: ${error.message}`);
        }
      }
    }

    return todos;
  }

  /**
   * Persist the current collection. Write failures do not interrupt the
   * in-memory operations.
   * @returns {boolean}
   */
  persist() {
    if (!this.storage || typeof this.storage.save !== 'function') {
      return false;
    }

    return this.storage.save(this.todos.map((todo) => todo.toJSON()));
  }

  /**
   * Create and store a new to-do item.
   * @param {unknown} title
   * @returns {{ id: string, title: string }}
   */
  create(title) {
    const todo = new TodoItem(this.idGenerator(), title);
    this.todos.push(todo);
    this.persist();
    return todo.toJSON();
  }

  /**
   * Return all stored to-do items in creation order.
   * @returns {Array<{ id: string, title: string }>}
   */
  getAll() {
    return this.todos.map((todo) => todo.toJSON());
  }

  /**
   * Update the title of an existing item.
   * @param {string} id
   * @param {unknown} title
   * @returns {{ id: string, title: string }}
   */
  update(id, title) {
    const index = this.todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      throw validationError('Todo not found', 404);
    }

    const todo = new TodoItem(id, title);
    this.todos[index] = todo;
    this.persist();
    return todo.toJSON();
  }

  /**
   * Remove an existing item.
   * @param {string} id
   * @returns {{ id: string, title: string }}
   */
  remove(id) {
    const index = this.todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      throw validationError('Todo not found', 404);
    }

    const [removed] = this.todos.splice(index, 1);
    this.persist();
    return removed.toJSON();
  }

  /**
   * Remove all stored items (useful for tests).
   * @returns {void}
   */
  clear() {
    this.todos.length = 0;
    this.persist();
  }
}

module.exports = { TodoService, createStorageAdapter };
